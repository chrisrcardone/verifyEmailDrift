# HOW IT WORKS

1.  The Agent types "/verify" into the Drift Conversation and sends it as a private note to kickoff an API call powered by Drift's Custom App Webhook for "[new_command_message](https://devdocs.drift.com/docs/webhook-events-1#event-types)" and with access to the following scopes which will need to be added to [the scopes your custom app requests](https://devdocs.drift.com/docs/quick-start#2-give-your-app-permission-scopes) when configuring the quick setup:

    1.  Conversation_read: so the server can gather the chatter's contact ID which is used to collect their email using the contact_read scope to send the verification code to
    2.  Contact_read: so the server can gather the email of the chatter using the contact ID retrieved using the conversation_read scope to send them a verification code
    3.  Conversation_write: so the server can post a message back using the Bot to the chatter informing them the code has been sent and as a [private note](https://devdocs.drift.com/docs/creating-a-message#field-definitions) type message back to the agent with the correct verification code for them to compare against

2.  Once the code is generated (usually less than 1 second), the chatter will receive back two messages from the chatbot (1) explaining the code was sent to X email and came from Y email address and (2) requesting the code back automatically to reduce the need for manual input from the agent:

    1.  ![](https://res.cloudinary.com/dikum9cue/image/upload/v1681192228/_aQru8OI1K_0cXxZULmJHkPJFL_Cq-1g14etSRr5hskFdf0wfKY3mU5SRby3dlVcZgGh887k0D4Yvu3SZPTpvGYCbOgDiz_FVbD2IAjuYm5diYKuDnDCBVup1P71Tu6ysXS6Y8NspyN_HNw2_eizv1p.png)\
    The sent from email communicated in the chat message uses the [environment variable](#env-variables) to leverage the email the verification code was sent to reduce the need for hardcoding.

3.  Directly following the messages to the chatter the agent will receive the code back, sent last so it's the latest message making it easier to compare with the code the chatter will provide back:

    1.  ![](https://res.cloudinary.com/dikum9cue/image/upload/v1681192206/GkUdJcOJf5oI5oxYMXG2k3-gWKz3wUHZ8ifL8Odi2A503hupmd1mK1KZ2_0vZrjN2TUFsdKsqF98grjsgt0QQ1i--Hyq2p8nPmDbog70d9nU3ogpZ4GZIsbuQTA9gEemVnNNkcL38Mnkrj70_lhblw4.png)

4.  The chatter will receive an email from the address you configure sent via your email sending service, the open-source code is preconfigured for SendGrid, however, this can be changed by overwriting the code for SendGrid in the sendEmail() function with the proper code for your email sending service's API

    1.  ![](https://res.cloudinary.com/dikum9cue/image/upload/v1681192188/CyPzQx8CsgoGHUd4eLkx_KAz3bEt_iiGN-rmbPKFbXxKKD8kyMm6wobwz_NAUgYufmDfKHRROsXBan5T6GFOAtql_Y-vLhpCTRlKQq7F-sBIx0A9yA-GrnZAcI8isJzGPIInhGrax0Y7AtBM_bzmjzk.png)
    2.  All the content of the email is dynamically changed via the [Environment Variables](#env-variables) set in your server configuration which use the following tokens:\
    ![](https://res.cloudinary.com/dikum9cue/image/upload/v1681192159/E0Lcei-MuWZ9RyfOQiQBfyJv4C8U4AJaWFCnHTRu4IuOD4ft5wtSEI0KPCOaeAhdMV-Png2_EdJDt4w_6s-Dcy2k5UlXX8WngpHZzjFCNjcel8yBK-17aE0sEd5B56BArIAxKe12yf3XPbSk_yxbrzy.png)\
    Of course, this is pre-configured to be hosted by Drift's Professional Services team and sent via SendGrid *(listed subprocessor)* from "support@drift.com."

5.  The workflow then concludes and no details about the conversation, contact, or verification code are stored on the server or in a database as all necessary details to complete the verification process were sent in the note to the agent.

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
