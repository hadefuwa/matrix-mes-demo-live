/* TEMPORARY OPEN ACCESS for the Matrix MES demo.
 *
 * The pages are still encrypted and the password prompt code is untouched. This script just types the
 * password in for the visitor, so the demo opens without a prompt. It switches itself off at EXPIRES
 * (24 hours after it was published) and clears any remembered login from the visitor's browser.
 *
 * To close the demo earlier: comment out everything between "OPEN ACCESS START" and "OPEN ACCESS END",
 * commit and push. Nothing else needs to change.
 */
// ===== OPEN ACCESS START =====
(function () {
  var EXPIRES = 1791957913000;          // 14 Oct 2026, 06:05 UTC
  var PASSWORD = "ummah123";

  if (Date.now() > EXPIRES) {
    try {
      localStorage.removeItem("staticrypt_passphrase");
      localStorage.removeItem("staticrypt_expiration");
    } catch (e) { /* storage blocked */ }
    return;
  }

  // Hide the prompt while it signs itself in, but never for long if something goes wrong.
  var hide = document.createElement("style");
  hide.textContent = "#staticrypt-form{visibility:hidden}";
  document.head.appendChild(hide);
  setTimeout(function () { hide.remove(); }, 4000);

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("staticrypt-form");
    var input = document.getElementById("staticrypt-password");
    if (!form || !input) return;
    input.value = PASSWORD;
    var remember = document.getElementById("staticrypt-remember");
    if (remember) remember.checked = true;
    setTimeout(function () {
      if (form.requestSubmit) form.requestSubmit(); else form.submit();
    }, 50);
  });
})();
// ===== OPEN ACCESS END =====
