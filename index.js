// Importing needed packages for this Nodejs Server
const express = require('express')
const app = express()
const request = require('request-promise-native');
const fs = require('fs').promises;
const crypto = require('crypto');
const client = require('@sendgrid/mail');
require('dotenv').config();

client.setApiKey(process.env.SENDGRID_API_KEY);


// Server PORT details
const PORT = process.env.PORT || 8080

// Starting Server
app.use(express.json());
app.listen(PORT, () => console.log(`Live on Port: ${PORT}`))
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

//Code Generator
const verificationCode = () => crypto.randomInt(100000, 999999).toString();

//Standardized Error Logging
function log(message, isError = false) {
  if (isError) {
    console.error(message);
  } else {
    console.log(message);
  }
}

//Email Configuration
const sendEmail = async function (email, code) {
  try {
    const emailTemplate = await fs.readFile('./emailTemplate.html', 'utf8');
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
      subject: `[${process.env.COMPANY_NAME}] Verification Code: ${code}`,
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
      log('Mail sent successfully', false);
    } catch (error) {
      log(error.response.body, true);
    }
  } catch (error) {
    log(error, true);
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
    log(error, true);
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
    log(error, true);
  }
}

app.all('*', (req, res) => {
  res.status(404).send('Page not found');
});

// This is the webhook to send Webhook Events to from Drift, here's how to have events sent here: https://devdocs.drift.com/docs/webhook-events-1
// You need to subscribe to the `new_command_message` event
// You need to add permissions: contact_read (allows us to get the email of the visitor), conversation_write (allows us to send the verification code into a private note in chat for agent's reference)
app.post('/messages', async (req, res) => {
  try {
    const {
      token,
      data: { conversationId: convoId, body: command, author },
    } = req.body;

    if (token !== process.env.DRIFT_VERIFICATION_TOKEN) {
      res.status(500).end();
      return;
    }

    if (!command.includes("/verify") || author.type !== "user") {
      res.status(200).end();
      return;
    }

    const code = verificationCode();
    const conversation = await getDriftData(`https://driftapi.com/conversations/${convoId}`);
    const contact = await getDriftData(`https://driftapi.com/contacts/${conversation.contactId}`);

    if (!contact.attributes.email) {
      await sendDriftMessage(convoId, 'private_note', 'Uh-oh! We could not find an email for this user, please add their email into the details panel and retry the verify slash command.');
      res.status(200).end();
      return;
    }

    await sendEmail(contact.attributes.email, code);
    await sendDriftMessage(convoId, 'chat', `I've sent your verification code to ${contact.attributes.email} from ${process.env.EMAIL_FROM_EMAIL}. Please allow up to two minutes for this email to arrive and check your spam folder should it not be in your inbox.`);
    await sendDriftMessage(convoId, 'chat', `Reply here with your verification code once you've retreived it.`);
    await sendDriftMessage(convoId, 'private_note', `Verification Code: ${code} | Sent To: ${contact.attributes.email}`);

    res.send('Verification process executed.');
  } catch (error) {
    log(error, true);
    res.status(500).send('Something went wrong');
  }
})
