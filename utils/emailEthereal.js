// This script uses MailSlurp for email testing.

// import mailslurp-client
const MailSlurp = require('mailslurp-client').default;
// OR import { MailSlurp } from "mailslurp-client"

const sendEmailWithMailSlurp = async () => {
  try {
    // create a client
    const apiKey =
      process.env.EMAIL_APIKEY_MAILSLURP ??
      'eba29d6b2e89e8d080214d30c2e555fe9f78c8869fd953463780efbefe6e179f'; // IMPORTANT: Replace with your actual API key or ensure process.env.API_KEY is set.

    if (
      apiKey ===
        'eba29d6b2e89e8d080214d30c2e555fe9f78c8869fd953463780efbefe6e179f' &&
      !process.env.EMAIL_APIKEY_MAILSLURP
    ) {
      console.warn(
        'Using a placeholder API_KEY. Please set your own process.env.API_KEY or update the script for MailSlurp.',
      );
      // Fallback to the original key if it was intentional, but issue a stronger warning.
      // For actual use, this script should fail or use a valid key.
      // The provided default key 'eba29d6b...' might be a test/example key.
    }

    const mailslurp = new MailSlurp({
      apiKey,
      basePath: 'https://api.mailslurp.com', // Explicitly set the standard base path
    });

    // 1. Create a new inbox. Let MailSlurp assign the ID and email address.
    // This is the most common way to get a fresh inbox for testing.
    console.log('Creating a new MailSlurp inbox...');
    // Use createInbox() or createInboxWithOptions({}) for a new temporary inbox
    const inbox = await mailslurp.createInbox();
    console.log(
      `Inbox created: ID = ${inbox.id}, Email = ${inbox.emailAddress}`,
    );

    // 2. Send an email from this new inbox.
    // The sendEmailAndConfirm method sends an email and waits for it to be processed by MailSlurp.
    console.log(`Sending email from inbox ${inbox.id}...`);
    const sendEmailOptions = {
      to: ['leinad@hello.com'], // `to` should be an array of recipient email strings
      subject: 'Hello from MailSlurp Test',
      body: 'This is the world, checking in via MailSlurp!',
    };

    const sentEmail = await mailslurp.inboxController.sendEmailAndConfirm({
      inboxId: inbox.id,
      sendEmailOptions: sendEmailOptions,
    });

    console.log('Email sent and confirmed by MailSlurp:');
    console.log(`  ID: ${sentEmail.id}`);
    console.log(`  From: ${sentEmail.from}`); // Should be inbox.emailAddress
    console.log(`  To: ${sentEmail.to.join(', ')}`);
    console.log(`  Subject: ${sentEmail.subject}`);

    // Basic check instead of `expect` (which is for testing frameworks)
    if (
      sentEmail.subject === sendEmailOptions.subject &&
      sentEmail.to.includes(sendEmailOptions.to[0])
    ) {
      console.log('Test assertion: Subject and recipient match. OK.');
    } else {
      console.error(
        'Test assertion: Subject or recipient does NOT match. FAILED.',
      );
    }
  } catch (err) {
    // err is likely the Response object from fetch when response.ok is false
    console.error('An error occurred with MailSlurp:');
    if (
      err &&
      typeof err.text === 'function' &&
      typeof err.status !== 'undefined'
    ) {
      // Check if err looks like a Response object
      try {
        const errorBody = await err.text();
        console.error(`  Status: ${err.status}`);
        console.error(`  Status Text: ${err.statusText || '(no status text)'}`);
        console.error(`  URL: ${err.url}`);
        console.error(`  MailSlurp Error Body: ${errorBody}`);
      } catch (textError) {
        console.error('  Could not parse error response body:', textError);
        console.error('  Original error object (Response):', err); // Log the full Response if parsing its body fails
      }
    } else {
      // Fallback for other types of errors (network errors, programming errors before fetch, etc.)
      console.error(
        `  Error message: ${err.message || 'No specific message available.'}`,
      );
      console.error('  Full error object:', err); // Log the full error object for more details
    }
  }
};

sendEmailWithMailSlurp();

// module.exports = sendEmailWithMailSlurp; // Uncomment if you plan to use it as a module
