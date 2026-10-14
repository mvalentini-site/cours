// Worker de python.html : exécute Python (Pyodide) hors de la page,
// pour que la page reste réactive et que le bouton Stop fonctionne.
import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs';

let py = null, drapeau = null, octets = null;

// ── Sortie regroupée : un message toutes les 40 ms au plus ──
let tampon = '', dernier = 0;
function envoyer(forcer){
  if (tampon && (forcer || performance.now() - dernier > 40 || tampon.length > 8000)){
    postMessage({ type:'out', text:tampon });
    tampon = '';
    dernier = performance.now();
  }
}

// ── Appelées depuis Python ──
// input() : attend la réponse de la page (SharedArrayBuffer + Atomics.wait).
// drapeau[0] : 0 = en attente, 1 = réponse prête, 2 = annulé ; drapeau[1] = nombre d'octets.
self.lireEntree = message => {
  envoyer(true);
  if (!drapeau) return null;
  Atomics.store(drapeau, 0, 0);
  postMessage({ type:'input', prompt:message });
  Atomics.wait(drapeau, 0, 0);
  if (Atomics.load(drapeau, 0) !== 1) return null;
  return new TextDecoder().decode(octets.slice(0, drapeau[1]));
};
self.envoyerFigure = b64 => { envoyer(true); postMessage({ type:'fig', b64 }); };

const PREPARATION = `
import builtins, js, sys, os, io, base64
os.environ["MPLBACKEND"] = "AGG"

def _saisie(message=""):
    sys.stdout.flush()
    r = js.lireEntree(str(message))
    if r is None:
        raise KeyboardInterrupt("saisie annulée")
    return r
builtins.input = _saisie

def _afficher_figures(*args, **kwargs):
    import matplotlib.pyplot as plt
    sys.stdout.flush()
    for num in plt.get_fignums():
        buf = io.BytesIO()
        plt.figure(num).savefig(buf, format="png", dpi=110, bbox_inches="tight")
        js.envoyerFigure(base64.b64encode(buf.getvalue()).decode())
    plt.close("all")

def _preparer_matplotlib():
    import matplotlib.pyplot as plt
    plt.show = _afficher_figures
`;

async function initialiser(m){
  if (m.entree){
    drapeau = new Int32Array(m.entree.drapeau);
    octets = new Uint8Array(m.entree.octets);
  }
  py = await loadPyodide();
  py.setStdout({ batched: s => { tampon += s + '\n'; envoyer(false); } });
  py.setStderr({ batched: s => { envoyer(true); postMessage({ type:'out', text:s + '\n', cls:'err' }); } });
  if (m.interruption) py.setInterruptBuffer(new Uint8Array(m.interruption));
  py.runPython(PREPARATION);
  postMessage({ type:'ready', version: py.runPython('import sys; sys.version.split()[0]') });
}

async function executer(code){
  const t0 = performance.now();
  try {
    postMessage({ type:'status', text:'Préparation des modules…' });
    await py.loadPackagesFromImports(code, { messageCallback: () => {} });
    if (/^\s*(import|from)\s+matplotlib/m.test(code)) py.runPython('_preparer_matplotlib()');
    postMessage({ type:'status', text:'Exécution…' });
    const ns = py.globals.get('dict')();
    ns.set('__name__', '__main__');
    try {
      await py.runPythonAsync(code, { globals:ns, filename:'<prog>' });
      py.runPython('import sys\nif "matplotlib.pyplot" in sys.modules: _afficher_figures()');
    } finally {
      ns.destroy();
    }
    py.runPython('import sys; sys.stdout.flush()');
    envoyer(true);
    postMessage({ type:'done', ok:true, duree:(performance.now() - t0) / 1000 });
  } catch(e){
    try { py.runPython('import sys; sys.stdout.flush()'); } catch(_){}
    envoyer(true);
    postMessage({ type:'done', ok:false, error:String(e.message || e) });
  } finally {
    try { py.runPython('import sys\nif "matplotlib.pyplot" in sys.modules:\n    import matplotlib.pyplot as plt; plt.close("all")'); } catch(_){}
  }
}

onmessage = e => {
  const m = e.data;
  if (m.type === 'init') initialiser(m).catch(err => postMessage({ type:'fail', error:String(err) }));
  else if (m.type === 'run') executer(m.code);
};
