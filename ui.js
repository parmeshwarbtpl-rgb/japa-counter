// Shared UI helpers

function showToast(message, type = "info", duration = 3200) {
    const region = document.getElementById("toastRegion");
    if (!region) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const text = document.createElement("span");
    text.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close message");
    closeButton.textContent = "×";

    const remove = () => {
        if (toast.parentNode) toast.remove();
    };

    closeButton.addEventListener("click", remove);
    toast.append(text, closeButton);
    region.appendChild(toast);

    window.setTimeout(remove, duration);
}

function setButtonBusy(button, isBusy, busyText = "Please wait…") {
    if (!button) return;

    if (isBusy) {
        button.dataset.originalHtml = button.innerHTML;
        button.disabled = true;
        button.textContent = busyText;
    } else {
        button.disabled = false;
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
            delete button.dataset.originalHtml;
        }
    }
}

function setConnectionStatus(status, text) {
    const element = document.getElementById("connectionText");
    if (!element) return;

    element.dataset.status = status;
    element.textContent = text;
}
