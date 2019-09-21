const dotenv = require('dotenv');
const request = require('request');
const utils = require('./utils');

dotenv.config();

/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.notifySlack = (data, context) => {
  const { timestamp, measure } = data;

  const message = determineMessage(measure);
  const freshness = determineFreshness(timestamp, measure);
  const fill = measure * 100;

  // Send to Slack
  makeRequest(message, freshness, fill);
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
  // Get minutes since time of brew
  const nowTime = Math.floor(Date.now() / 1000);
  const timeSince = (nowTime - timestamp) / 60;

  let fillFactor,
      timeFactor;

  /**
   *  Coffee quality matrix
   *  Vertical: minutes since brew
   *  Horizontal: canister fill level
   *        >90%    >70%    >50%    >30%    >15%    <15%
   *  < 5   Amazing Amazing Awesome Awesome Great   Decent
   *  < 45  Amazing Awesome Awesome Great   Decent  Average
   *  < 90  Awesome Awesome Great   Decent  Average Risky
   *  < 120 Awesome Great   Decent  Average Risky   Shady
   *  < 240 Great   Decent  Average Risky   Shady   Shitty
   *  > 240 Decent  Average Risky   Shady   Shitty  Don't
   */
  const quality = [
    [ 'Amazing',  'Amazing',  'Awesome',  'Awesome',   'Great',  'Decent' ],
    [ 'Amazing',  'Awesome',  'Awesome',    'Great',  'Decent', 'Average' ],
    [ 'Awesome',  'Awesome',    'Great',   'Decent', 'Average',   'Risky' ],
    [ 'Awesome',    'Great',   'Decent',  'Average',   'Risky',   'Shady' ],
    [   'Great',   'Decent',  'Average',    'Risky',   'Shady',  'Shitty' ],
    [  'Decent',  'Average',    'Risky',    'Shady',  'Shitty',  'Don\'t' ],
  ];
  fillFactor = utils.getFactor([0.90, 0.70, 0.50, 0.30, 0.15], fill);
  timeFactor = utils.getFactor([5, 45, 90, 120, 240], timeSince, true);

  const freshness = quality[timeFactor][fillFactor];
  return freshness;
}
