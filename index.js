// Importing needed packages for this Nodejs Server
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const request = require('request-promise-native');
const fs = require('fs');
const crypto = require('crypto');
const util = require('util');
const client = require('@sendgrid/mail');
require('dotenv').config();

client.setApiKey(process.env.SENDGRID_API_KEY);


// Server PORT details
const PORT = process.env.PORT || 8080

// Starting Server
app.use(bodyParser.json());
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
app.listen(PORT, () => console.log(`Live on Port: ${PORT}`))

//Code Generator
const verificationCode = function () {
  return crypto.randomInt(1000, 10000).toString();
};

//Email Configuration
const sendEmail = async function (email, code) {
  const emailTemplate = await util.promisify(fs.readFile)('./emailTemplate.html', 'utf8');
  const message = {
    personalizations: [
      {
        to: [
          {
            email: email
          }
        ]
      }
    ],
    from: {
      email: process.env.EMAIL_FROM_EMAIL,
      name: process.env.EMAIL_FROM_NAME
    },
    replyTo: {
      email: process.env.REPLY_TO_EMAIL
    },
    subject: `${process.env.COMPANY_NAME} Verification Code: ${code}`,
    content: [
      {
        type: 'text/html',
        value: emailTemplate.replaceAll('{{code}}', code).replaceAll('{{company}}', process.env.COMPANY_NAME)
      }
    ],
    mailSettings: {
      bypassListManagement: {
        enable: true
      },
      footer: {
        enable: false
      },
      sandboxMode: {
        enable: false
      }
    },
    trackingSettings: {
      clickTracking: {
        enable: false,
        enableText: false
      },
      openTracking: {
        enable: false
      },
      subscriptionTracking: {
        enable: false
      }
    }
  };
  
  try {
    await client.send(message);
    console.log('Mail sent successfully');
  } catch (error) {
    console.error(error);
    console.error(error.response.body);
  }
}

async function getDriftData(url) {
  try {
    const response = await request.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `bearer ${process.env.DRIFT_API_KEY}`
      },
      json: true
    });

    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function sendDriftMessage(convoId, type, body) {
  try {
    await request.post(`https://driftapi.com/conversations/${convoId}/messages`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `bearer ${process.env.DRIFT_API_KEY}`
      },
      body: {
        type,
        body
      },
      json: true
    });
  } catch (error) {
    console.error(error);
  }
}

// This is the webhook to send Webhook Events to from Drift, here's how to have events sent here: https://devdocs.drift.com/docs/webhook-events-1
// You need to subscribe to the `new_command_message` event
// You need to add permissions: contact_read (allows us to get the email of the visitor), conversation_write (allows us to send the verification code into a private note in chat for agent's reference)
app.post('/messages', async (req, res) => {
  const convoId = req.body.data.conversationId;

  // Confirming request has proper token, if in test mode, not requiring token
  if (req.body.token !== process.env.DRIFT_VERIFICATION_TOKEN) {

    // Rejecting request.
    res.status(500).end()

    return

  }

  // Confirming that the command message is `/verify` and not something else.
  if (!req.body.data.body.includes("/verify") || req.body.data.author.type !== "user") {

    res.status(200).end()

    // Ending process as the command message did not match criteria
    return

  }
  const code = verificationCode();

  try {
    const conversation = await getDriftData(`https://driftapi.com/conversations/${convoId}`);
    const contact = await getDriftData(`https://driftapi.com/contacts/${conversation.contactId}`);

    if (!contact.attributes.email) {
      await sendDriftMessage(convoId, 'private_note', 'Uh-oh! We could not find an email for this user, please add their email into the details panel and retry the verify slash command.');
      res.status(200).end();
      return;
    }

    await sendEmail(contact.attributes.email, code);
    await sendDriftMessage(convoId, 'private_note', `Success! Their verification code is ${code}. We've sent this to their email, ${contact.attributes.email}.`);
    await sendDriftMessage(convoId, 'chat', `A verification code has been sent to your email, ${contact.attributes.email}. Please reply here with that code to verify yourself.`);

  } catch (error) {
    console.error(error);
  }

  res.send('Verification process executed.');

})