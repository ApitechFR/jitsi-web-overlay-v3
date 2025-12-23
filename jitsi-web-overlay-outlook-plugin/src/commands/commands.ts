import { configs } from "../../configs";
import { generateRoomName } from "../helpers/roomNameGenerator";
//import axios from "axios";
//import axios from "axios";

/* global Office */

Office.onReady(() => {
  // If needed, Office.js is ready to be called.
});

/**
 * Fonction utilitaire pour effectuer une requête HTTP et renvoyer la réponse.
 * @param {string} url - URL à interroger.
 * @returns {Promise<string|null>} - Réponse sous forme de texte ou null en cas d'échec.
 */
// async function load(url) {
//   try {
//     const response = await axios.get(url);
//     if (response.status !== 200) {
//       console.error(`{Meet Plugin} Erreur HTTP : ${response.status}`);
//     }
//     return response.data;
//   } catch (error) {
//     console.error("{Meet Plugin} Erreur lors de la requête :", error);
//     return null;
//   }
// }
/**
 * Shows a notification when the add-in command is executed.
 * @param event
 */
function action(event: Office.AddinCommands.Event) {
  const message: Office.NotificationMessageDetails = {
    type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
    message: "Performed action.",
    icon: "Icon.80x80",
    persistent: true,
  };

  // Show a notification message.
  Office.context.mailbox.item.notificationMessages.replaceAsync("ActionPerformanceNotification", message);

  // Be sure to indicate when the add-in command function is complete.
  event.completed();
}

// Register the function with Office.
Office.actions.associate("action", action);

/**
 * Récupère les numéros de téléphone et le code PIN pour la conférence.
 * @param {string} roomName - Nom de la salle.
 * @returns {Promise<object>} - Contient les numéros de téléphone et le code PIN.
 */
// async function getPhoneDetails(roomName) {
//   const phoneNumbers = [];
//   let pinCode = "";

//   if (configs.ENABLE_PHONE_ACCESS) {
//     try {
//       const phoneResult = await load(
//         `${configs.dialInNumbersUrl}?conference=${roomName}@conference.${configs.JITSI_DOMAIN}`
//       );
//       console.log("{Meet Plugin} Phone result:", phoneResult);
//       if (phoneResult && phoneResult.numbers) {
//         Object.keys(phoneResult.numbers).forEach((key) => {
//           phoneResult.numbers[key].forEach((number) => {
//             phoneNumbers.push(
//               configs.PHONE_NUMBER_FORMAT.replace("%phone_number%", number).replace("%phone_country%", key)
//             );
//           });
//         });
//       }
//     } catch (error) {
//       console.error("{Meet Plugin} Erreur lors de la récupération des numéros de téléphone :", error);
//     }

//     try {
//       const pinResult = await load(
//         `${configs.dialInConfCodeUrl}?conference=${roomName}@conference.${configs.JITSI_DOMAIN}`
//       );
//       console.log("{Meet Plugin} PIN result:", pinResult);
//       if (pinResult && pinResult.id) {
//         pinCode = pinResult.id;
//       }
//     } catch (error) {
//       console.error("{Meet Plugin} Erreur lors de la récupération du code PIN :", error);
//     }
//   }

//   return { phoneNumbers, pinCode };
// }

/**
 * Génère les détails de la réunion et les ajoute au corps de l'invitation.
 * @param {Office.AddinCommands.Event} event - Événement de la commande Office.
 */
async function generateMeeting(event) {
  const roomName = generateRoomName();
  //const { phoneNumbers, pinCode } = await getPhoneDetails(roomName);

  const meetingIdentifier = "joona-meeting-details";
  const meetingDetailsHtml = `
    <hr style="border: 1px solid #ccc; margin-top: 20px;">
    <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;" id="${meetingIdentifier}">
        <strong>${configs.TITLE_MEETING_DETAILS}</strong><br>
        <div style="margin-bottom:6px">
        <a style="font-size:20px; font-weight:600; text-decoration:underline; color:#5B5FC7; cursor:pointer "
          data-auth="NotApplicable" rel="noreferrer noopener" href="https://${configs.JITSI_DOMAIN}/${roomName}"
          target="_blank">
          Rejoignez la réunion maintenant</a><br>
        </div>
    
    </div>
    <hr style="border: 1px solid #ccc; margin-top: 20px;">
  `;

  Office.context.mailbox.item.body.getAsync(Office.CoercionType.Html, (result) => {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      const currentBody = result.value || "";

      if (!currentBody.includes(meetingIdentifier)) {
        // Ajoutez `meetingDetailsHtml` seulement s'il n'est pas déjà présent
        const updatedBody = currentBody + meetingDetailsHtml;

        Office.context.mailbox.item.body.setAsync(
          updatedBody,
          { coercionType: Office.CoercionType.Html },
          (setResult) => {
            if (setResult.status === Office.AsyncResultStatus.Succeeded) {
              console.log("{Meet Plugin} Détails de la réunion ajoutés avec succès !");
            } else {
              console.error("{Meet Plugin} Erreur lors de l'ajout des détails de la réunion :", setResult.error);
            }
            event.completed();
          }
        );

        //add link in location
        const joonaLink = "https://" + configs.JITSI_DOMAIN + "/" + roomName;

        Office.context.mailbox.item.location.setAsync(joonaLink, (result) => {
          if (result.status === Office.AsyncResultStatus.Failed) {
            console.error("{Meet Plugin} Failed to set location:", result.error.message);
          } else {
            console.log("{Meet Plugin} Location set to HelloWork successfully!");
          }

          event.completed();
        });
      } else {
        console.log("{Meet Plugin} Les détails de la réunion sont déjà présents dans le corps.");
        event.completed();
      }
    } else {
      console.error("{Meet Plugin} Erreur lors de la récupération du contenu actuel :", result.error);
      event.completed();
    }
  });
}

// Associer la commande à votre bouton dans l'add-in
Office.actions.associate("generateMeeting", generateMeeting);
