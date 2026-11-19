(() => {
  'use strict';
  // Local UI lock, not server authorization. No plaintext password is stored.
  const credentials = {"salt": "f34ed2bb6ac7c0407488d93f7af7ace1", "hash": "21bb2d7738f3ddb93bca101c552043422511e8f6385623be04cbc66ed946a2d2"};
  const form = document.getElementById('loginForm');
  const input = document.getElementById('loginPassword');
  const button = document.getElementById('loginSubmit');
  const message = document.getElementById('loginMessage');
  let busy = false;
  const fromHex = value => Uint8Array.from(value.match(/../g), part => parseInt(part, 16));

  async function verify(password) {
    if (!globalThis.crypto?.subtle) {
      throw new Error('Deschide aplicația local sau prin HTTPS într-un browser actualizat.');
    }
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({
      name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(credentials.salt), iterations: 600000
    }, key, 256);
    const actual = new Uint8Array(bits);
    const expected = fromHex(credentials.hash);
    let difference = actual.length ^ expected.length;
    for (let i = 0; i < expected.length; i++) difference |= actual[i] ^ expected[i];
    return difference === 0;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        reject(new Error('Nu s-au putut încărca fișierele aplicației. Reîncarcă pagina și verifică arhiva.'));
      };
      document.body.appendChild(script);
    });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    button.disabled = true;
    message.textContent = 'Se verifică parola…';
    try {
      const password = input.value;
      input.value = '';
      if (!await verify(password)) {
        message.textContent = 'Parolă incorectă. Încearcă din nou.';
        input.focus();
        return;
      }
      message.textContent = 'Se deschide aplicația…';
      await loadScript('quiz-list.txt?v=571');
      await loadScript('app.js?v=571');
      document.getElementById('quizApp').hidden = false;
      document.getElementById('loginScreen').hidden = true;
      document.querySelector('#quizFileList input')?.focus();
      message.textContent = '';
    } catch (error) {
      message.textContent = error.message || 'Autentificarea nu a reușit. Reîncarcă pagina.';
    } finally {
      busy = false;
      button.disabled = false;
    }
  });
  document.getElementById('logoutBtn').addEventListener('click', () => location.reload());
})();
