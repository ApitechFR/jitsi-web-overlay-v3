import { APP_VERSION } from "../../configs";
const url = process.env.ADDIN_BASE_URL || "/";
const baseUrl = url.split("/").slice(0, 3).join("/");

document.addEventListener("DOMContentLoaded", function () {
  const meetLink = document.getElementById("meet") as HTMLAnchorElement;
  if (meetLink) {
    meetLink.href = baseUrl;
  }
  //get the version from the package.json file
  const version = document.getElementById("version") as HTMLSpanElement;
  if (version) {
    version.innerText = `v${APP_VERSION}`;

    console.info({ "Infos: Vous etes sur la plateforme": baseUrl, Version: APP_VERSION });
  }
});
