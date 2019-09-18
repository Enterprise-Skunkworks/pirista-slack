const dotenv = require('dotenv');
const request = require('request');

dotenv.config();

/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.notifySlack = (data, context) => {
  const url = process.env.SLACK_WEBHOOK_URL;
  const { timestamp, measure } = data;

  const message = determineMessage(measure);
  const freshness = determineFreshness(timestamp, measure);
  const fill = measure * 100;

  // Send to Slack if there is more than 5% left
  if (fill > 5) makeRequest(message, freshness, fill);
}

// Make request
function makeRequest(message, freshness, fill) {
  const url = process.env.SLACK_WEBHOOK_URL;
  try {
    const res = request.post({
      url,
      headers: { 'Content-type' : 'application/json' },
      body: {
        text: 'Coffee Status Update',
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Coffee Status Update*",
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*Fill level:* ${fill}%`,
              },
              {
                type: "mrkdwn",
                text: `*Freshness:* ${freshness}`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "plain_text",
              text: message,
            },
          },
        ],
      },
      json: true,
    });
    console.log(`Posted Slack notification to channel`, url);
  } catch(e) {
    console.error('Could not post Slack notification', e);
  }
}

// Determine message
function determineMessage(measure) {
  let message = "";
  switch(true) {
    case (measure >= 0.95):
      message = "Some fresh-brewed coffee is waiting for you at the kitchen!";
      break;
    case (measure >= 0.75):
      message = "Lots of delicious, mysterious liquid left. Go get it.";
      break;
    case (measure > 0.5):
      message = "More than half the can is still left! Go get some of that mysterious liquid.";
      break;
    case (measure > 0.3):
      message = "There's still a good amount of coffee left. Go get it before someone else!";
      break;
    case (measure >= 0.17):
      message = "Coffee availability is approaching dangerously low levels. Be fast or get whooshed.";
      break;
    default:
      message = "Coffee availability level is low. Approach at your own risk.";
  };
  return message;
}

// Determine freshness
function determineFreshness(timestamp, fill) {
  return 'Decent'; // @TODO: make freshness thing
}
