const express = require('express');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

const app = express();
const port = 5000;

const apiId = 928403;
const apiHash = '4a546388b91f6f815c4a6adbbc30d574';
const stringSession = new StringSession('');

app.use(express.json());
app.get('/', (req, res) => {
  res.status(200).send(`Hello from the server`);
});

let phoneNumberForLogin = '';
let otpCallback = null;

// This route initiates the login process by sending the phone number
// app.post('/initiate-login', async (req, res) => {
//   try {
//     const { phoneNumber } = req.body;
//     phoneNumberForLogin = phoneNumber;

//     // Here you can perform any additional steps before sending the OTP to the frontend

//     res.status(200).json({ message: 'Ready to receive OTP from the frontend' });
//   } catch (error) {
//     console.error('Initiate login error:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// This route receives the OTP from the frontend
app.post('/submit-otp', (req, res) => {
  try {
    const { otp } = req.body;

    // Set the OTP in the callback variable
    otpCallback(otp);

    res.status(200).json({ message: 'OTP submitted successfully' });
  } catch (error) {
    console.error('Submit OTP error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// This route handles the entire login process
app.post('/login', async (req, res) => {
    const {phoneNumber} = req.body;
  try {
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    // Start the authentication process
    await client.start({
      phoneNumber: async () => phoneNumber,
      phoneCode: async (sentCode) => {
        // Inform the frontend to provide the OTP
       // res.status(200).json({ message: 'Provide OTP from the frontend' });
        console.log(`Provide OTP`);
        // Create a promise to wait for the OTP from the frontend
        const otpPromise = new Promise((resolve) => {
          otpCallback = resolve;
        });

        // Wait for the OTP from the frontend
        const otp = await otpPromise;

        // Return the obtained OTP
        return otp;
      },
      onError: (err) => console.log(err),
    });

    console.log('You should now be connected.');
    const sessionString = client.session.save();

    // Send a message (example)
    await client.sendMessage('me', { message: 'Hello from Express!' });

    res.status(200).json({ message: 'Login successful', session: sessionString });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    // Reset callback and phone number after completion
    otpCallback = null;
    phoneNumberForLogin = '';
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
