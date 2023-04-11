# SECURITY DETAILS
## Verification Code
We generate a 6 digit code that is never saved on the server and only sent back to the agent via a private note which cannot be accessed by the visitor on browser-side. The likelihood of this code being guessed by the visitor is 1/1000000.
## Your Data
We do not store the code, conversation details, or contact details on the server at any time, the details are only used in real-time to generate the code, email, and responses sent back to the agent and visitor. Once we've sent the three messages (1 private note containing the code sent back to the agent and 2 chat messages sent to the visitor informing them the code is sent) and the email, the server moves forward without any stored memory of the details.

# OPERATION OVERVIEW
![Process Overview](https://res.cloudinary.com/dikum9cue/image/upload/v1681063955/Untitled_-_Frame_1_2_oacb3m.jpg)

# .ENV VARIABLES
- PORT
- DRIFT_API_KEY
  - Your API Key from Drift which is found by [Setting Up a Drift Custom App](https://devdocs.drift.com/docs/quick-start) once you **[install the app into your Drift Account](https://devdocs.drift.com/docs/quick-start#3-install-it-to-your-drift-account-) which the credentials of you've used to log into the [Drift Dev Portal](https://dev.drift.com/) where you configured the custom app.**
- DRIFT_VERIFICATION_TOKEN
  - Verification Token for Your Drift App which can be found [following these steps](https://devdocs.drift.com/docs/webhook-events-1#verification-token) in the Drift Dev Docs.
- EMAIL_FROM_NAME
  - Name Email is Sent From
- EMAIL_FROM_EMAIL
  - Email the Code Email is Sent From
- COMPANY_NAME
  - Company Name Used in Email Sent to Chatter with Verification Code
- SENDGRID_API_KEY
  - SendGrid API created following [this guide from SendGrid](https://docs.sendgrid.com/ui/account-and-settings/api-keys#creating-an-api-key).
- REPLY_TO_EMAIL
  - Reply To Email Used for Verification Email, usually a support@ email the responses can go to and be generated into tickets
