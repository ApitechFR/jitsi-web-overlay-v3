const url = process.env.ADDIN_BASE_URL || "/";

document.addEventListener("DOMContentLoaded", function () {
  const urlLink = document.getElementById("base_url") as HTMLAnchorElement;
  if (urlLink) {
    urlLink.href = url + "/manifest.xml";
    urlLink.innerText = url + "/manifest.xml";
  }
});
