const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =========================================================
// NEUROBRIDGE USSD SERVER — full build
// =========================================================
// HOW THIS FILE WORKS
// Africa's Talking POSTs to /ussd every time the caller presses a key.
// "text" accumulates like "1", "1*2", "1*2*1" as they go deeper.
// We split that into an array of "steps" and walk our menu structure.
//
// ⚠️ IMPORTANT: This file contains PLACEHOLDER phone numbers and
// placeholder clinic/school/emergency data, clearly marked below.
// Replace every PLACEHOLDER with verified, current, real contact
// details before this goes live — especially the Emergency/Helpline
// section, since wrong numbers there could cause real harm.
// =========================================================


// ---------------------------------------------------------
// SECTION 1: Reusable tree engine (used by Exercises + Caregiver Tips)
// ---------------------------------------------------------
// A "menu" node has children keyed by digit.
// A "leaf" node has content text and an `actions` map, e.g.
//   { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' }
// A leaf with NO actions is a plain dead-end (session ends there).

function walkTree(rootNode, steps) {
  let node = rootNode;
  const stack = []; // remembers menu nodes so "Back" can pop to the parent
  let i = 0;

  while (i < steps.length) {
    const key = steps[i];

    if (node.type === 'menu' && node.children[key]) {
      stack.push(node);
      node = node.children[key];
      i++;
    } else if (node.type === 'leaf' && node.actions && node.actions[key]) {
      const action = node.actions[key];
      if (action === 'DONE') {
        return { end: true, text: node.doneText || 'Marked as done. Great job!' };
      } else if (action === 'REPEAT') {
        i++; // stay on the same leaf, loop will just re-render it
      } else if (action === 'BACK') {
        node = stack.pop() || rootNode;
        i++;
      }
    } else {
      return { end: true, text: 'Invalid selection. Please dial in again.' };
    }
  }

  // Reached the end of the pressed keys — render whatever we're standing on
  if (node.type === 'menu') {
    return { end: false, text: node.text };
  }
  if (node.type === 'leaf') {
    if (!node.actions) {
      return { end: true, text: node.text };
    }
    const labels = { DONE: 'Done', REPEAT: 'Repeat', BACK: 'Back' };
    const optionLines = Object.entries(node.actions)
      .map(([k, a]) => `${k}. ${labels[a]}`)
      .join('\n');
    return { end: false, text: `${node.text}\n\n${optionLines}` };
  }
}

function renderTreeResult(result) {
  return result.end ? `END ${result.text}` : `CON ${result.text}`;
}


// ---------------------------------------------------------
// SECTION 2: Therapy & Exercises tree (menu option 1)
// ---------------------------------------------------------
const exercisesTree = {
  type: 'menu',
  text: 'Therapy & Exercises\n1. Positioning & Support\n2. Stretching\n3. Strength & Movement\n4. Head & Trunk Control\n5. Balance\n6. Hand Function',
  children: {
    '1': {
      type: 'menu',
      text: 'Positioning & Support\n1. Hip & Knee\n2. Hand & Thumb\n3. Elbow',
      children: {
        '1': {
          type: 'leaf',
          text: 'HIP & KNEE\n\nSpasticity may cause legs to cross tightly.\n\nPlace a rolled towel between the knees to keep legs apart.\n\nDo not force the legs apart.',
          actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
          doneText: 'Noted. Great job supporting hip & knee positioning today!'
        },
        '2': {
          type: 'leaf',
          text: 'HAND POSITION\n\nSpasticity may close the hand into a fist.\n\nUse a resting splint to keep fingers open and thumb away from the palm.',
          actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
          doneText: 'Noted. Great job with hand positioning today!'
        },
        '3': {
          type: 'leaf',
          text: 'ELBOW POSITION\n\nDuring rest, support the arm extended using foam wedges or prescribed equipment.\n\nAvoid forcing the elbow straight.',
          actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
          doneText: 'Noted. Great job with elbow positioning today!'
        }
      }
    },
    '2': {
      type: 'menu',
      text: 'Stretching Tips\n\nGo slow. Ease in over 10-15s, hold 30-60s, release slowly. Never bounce or force.\n\n1. Continue',
      children: {
        '1': {
          type: 'menu',
          text: 'Stretching\n1. Inner Thigh\n2. Wrist & Fingers\n3. Hamstring',
          children: {
            '1': {
              type: 'leaf',
              text: 'INNER THIGH STRETCH\n\nLie child on back.\nBend knees, feet flat.\nGently guide knees outward.\nMove slowly to resistance.\nHold 30-60 sec.',
              actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
              doneText: 'Great job! Inner thigh stretch marked as done.'
            },
            '2': {
              type: 'leaf',
              text: 'WRIST & FINGERS\n\nSupport the elbow straight.\nPull thumb out of palm.\nFlatten fingers gently.\nBend wrist back slowly.\nHold 30-60 sec.',
              actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
              doneText: 'Great job! Wrist & fingers stretch marked as done.'
            },
            '3': {
              type: 'leaf',
              text: 'HAMSTRING STRETCH\n\nSit on a bench, one leg straight on a stool.\nKeep back straight.\nPress gently above the knee.\nHold 30-60 sec.',
              actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
              doneText: 'Great job! Hamstring stretch marked as done.'
            }
          }
        }
      }
    },
    '3': {
      type: 'menu',
      text: 'Strength & Movement\n1. Antagonist Training\n2. Trunk Rotation',
      children: {
        '1': {
          type: 'leaf',
          text: 'MUSCLE STRENGTH\n\nIf the elbow stays bent, train the opposing muscle.\n\nTry:\n- Push against resistance\n- Push a weighted toy\n- Reach for objects\n\nStop if pain occurs.',
          actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
          doneText: 'Great job! Strength exercise marked as done.'
        },
        '2': {
          type: 'leaf',
          text: 'TRUNK ROTATION\n\nSit child securely.\nEncourage slow reaching left and right.\n\nThis separates shoulder and hip movement, reducing stiffness.',
          actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
          doneText: 'Great job! Trunk rotation marked as done.'
        }
      }
    },
    '4': {
      type: 'menu',
      text: 'Head & Trunk Control\n1. Supported Tummy Time\n2. Pull-to-Sit\n3. Therapy Ball',
      children: {
        '1': {
          type: 'leaf',
          text: 'TUMMY TIME\n\nPlace a firm roll under the chest and armpits, arms forward.\n\nUse a toy or your voice to encourage lifting the head.\n\nKeep the child supervised.',
          actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
          doneText: 'Great job! Tummy time marked as done.'
        },
        '2': {
          type: 'leaf',
          text: 'PULL-TO-SIT\n\nChild lies on back.\nSupport head, neck, shoulders.\nSlowly bring upper body toward sitting.\n\nHold if neck muscles tighten.\nStop if child is distressed.',
          actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
          doneText: 'Great job! Pull-to-sit marked as done.'
        },
        '3': {
          type: 'leaf',
          text: 'THERAPY BALL\n\nSit child securely on a soft therapy ball.\nHold at hips or lower ribs.\nGently rock 1-2 inches.\n\nUse only small movements.',
          actions: { '1': 'DONE', '2': 'REPEAT', '3': 'BACK' },
          doneText: 'Great job! Therapy ball exercise marked as done.'
        }
      }
    },
    '5': {
      type: 'leaf',
      text: 'BALANCE EXERCISES\n\nContent coming soon. Please check back later or ask your therapist for balance exercises.'
      // no actions -> plain END
    },
    '6': {
      type: 'leaf',
      text: 'HAND FUNCTION EXERCISES\n\nContent coming soon. Please check back later or ask your therapist for hand function exercises.'
      // no actions -> plain END
    }
  }
};


// ---------------------------------------------------------
// SECTION 3: Caregiver Tips tree (menu option 3)
// ---------------------------------------------------------
const caregiverTipsTree = {
  type: 'menu',
  text: 'Caregiver Tips\n1. Safe Stretching\n2. Positioning Basics\n3. Exercise Safety\n4. When to Stop\n5. When to Seek Help',
  children: {
    '1': {
      type: 'leaf',
      text: "SAFE STRETCHING\n\nAlways stretch slowly. Never bounce or force.\n\nHold each stretch 30-60 seconds.\n\nStop if the child cries or shows pain.",
      actions: { '1': 'BACK' }
    },
    '2': {
      type: 'leaf',
      text: "POSITIONING BASICS\n\nChange the child's position every 1-2 hours.\n\nSupport hips, knees, and hands in a comfortable, neutral position.\n\nNever force joints into place.",
      actions: { '1': 'BACK' }
    },
    '3': {
      type: 'leaf',
      text: 'EXERCISE SAFETY\n\nOnly do exercises shown or approved by your therapist.\n\nStop immediately if you notice pain, swelling, or unusual stiffness.',
      actions: { '1': 'BACK' }
    },
    '4': {
      type: 'leaf',
      text: 'WHEN TO STOP\n\nStop the exercise if the child shows:\n- Pain or crying\n- Breathing difficulty\n- Sudden stiffness increase\n- Signs of distress',
      actions: { '1': 'BACK' }
    },
    '5': {
      type: 'leaf',
      text: 'WHEN TO SEEK HELP\n\nContact your therapist or clinic if:\n- Symptoms are getting worse\n- The child refuses all movement\n- You notice new swelling or injury\n- You are unsure how to help',
      actions: { '1': 'BACK' }
    }
  }
};


// ---------------------------------------------------------
// SECTION 4: Nearby Help data — clinics & schools by county
// ---------------------------------------------------------
// ⚠️ PLACEHOLDER DATA — replace every name/phone with verified,
// real, current contact details before launch.
const NEARBY_DATA = {
  '1': {
    name: 'Nairobi',
    clinics: [
      { name: "PLACEHOLDER — Gertrude's Children's Hospital, Physiotherapy", phone: '+254 PLACEHOLDER' },
      { name: 'PLACEHOLDER — Kenyatta National Hospital, Physio Dept', phone: '+254 PLACEHOLDER' }
    ],
    schools: [
      {
        name: 'PLACEHOLDER — Special Needs School, Nairobi',
        phone: '+254 PLACEHOLDER',
        tags: ['Wheelchair accessible', 'Special needs unit']
      }
    ]
  },
  '2': {
    name: 'Kisumu',
    clinics: [
      { name: 'PLACEHOLDER — Referral Hospital, Physio Dept', phone: '+254 PLACEHOLDER' }
    ],
    schools: [
      {
        name: 'PLACEHOLDER — Special Needs School, Kisumu',
        phone: '+254 PLACEHOLDER',
        tags: ['Special needs unit']
      }
    ]
  },
  '3': {
    name: 'Mombasa',
    clinics: [
      { name: 'PLACEHOLDER — Coast General Hospital, Physio Dept', phone: '+254 PLACEHOLDER' }
    ],
    schools: [
      {
        name: 'PLACEHOLDER — Special Needs School, Mombasa',
        phone: '+254 PLACEHOLDER',
        tags: ['Wheelchair accessible']
      }
    ]
  }
};

function countyMenuText() {
  const lines = Object.entries(NEARBY_DATA).map(([code, c]) => `${code}. ${c.name}`);
  return `Select your county:\n${lines.join('\n')}`;
}

function handleFindNearbyHelp(rest) {
  if (rest.length === 0) {
    return `CON Find Nearby Help\n1. Clinics/Therapists\n2. Schools for Children's Needs`;
  }
  const category = rest[0]; // '1' clinics, '2' schools
  if (category !== '1' && category !== '2') {
    return `END Invalid selection. Please dial in again.`;
  }
  if (rest.length === 1) {
    return `CON ${countyMenuText()}`;
  }
  const countyCode = rest[1];
  const county = NEARBY_DATA[countyCode];
  if (!county) {
    return `END Invalid selection. Please dial in again.`;
  }
  const list = category === '1' ? county.clinics : county.schools;
  const lines = list.map(item => {
    const tagText = item.tags ? ` (${item.tags.join(', ')})` : '';
    return `${item.name}${tagText}\n${item.phone}`;
  });
  return `END ${county.name} — ${category === '1' ? 'Clinics/Therapists' : 'Schools'}:\n\n${lines.join('\n\n')}\n\nFull details will follow by SMS.`;
}


// ---------------------------------------------------------
// SECTION 5: Daily Progress (menu option 2) — needs per-caller state
// ---------------------------------------------------------
// ⚠️ LIMITATION: this stores progress in memory only. It resets if
// the server restarts (e.g. Glitch redeploys), and doesn't
// automatically roll over to a fresh week. For real use, swap this
// for a proper database (see note at the end of this file).
const progressStore = {};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ensureProgress(phoneNumber) {
  if (!progressStore[phoneNumber]) {
    progressStore[phoneNumber] = { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false };
  }
  return progressStore[phoneNumber];
}

function markToday(phoneNumber) {
  const p = ensureProgress(phoneNumber);
  const today = WEEKDAYS[new Date().getDay()];
  p[today] = true;
}

function weeklyProgressText(phoneNumber) {
  const p = ensureProgress(phoneNumber);
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const completed = order.filter(d => p[d]).length;
  const grid = order.map(d => `${d}[${p[d] ? 'x' : '-'}]`).join(' ');
  return `PROGRESS THIS WEEK\n\nSessions completed: ${completed}/7\n\n${grid}\n\nKeep following your therapy plan.`;
}

const TODAY_EXERCISE_LABELS = {
  '1': 'Stretching',
  '2': 'Positioning Check',
  '3': 'Strength Exercise',
  '4': 'Head/Trunk Exercise'
};

function handleDailyProgress(rest, phoneNumber) {
  if (rest.length === 0) {
    return `CON Daily Progress\n1. Today's Exercises\n2. Mark Exercise Done\n3. Weekly Progress\n4. View Goals`;
  }

  const branch = rest[0];

  if (branch === '1') {
    if (rest.length === 1) {
      return `CON Today\n1. Stretching\n2. Positioning Check\n3. Strength Exercise\n4. Head/Trunk Exercise\n\nSelect completed:`;
    }
    const exerciseCode = rest[1];
    const label = TODAY_EXERCISE_LABELS[exerciseCode];
    if (!label) return `END Invalid selection. Please dial in again.`;
    if (rest.length === 2) {
      return `CON ${label}\n\nCompleted today?\n1. Yes\n2. No`;
    }
    const answer = rest[2];
    if (answer === '1') {
      markToday(phoneNumber);
      return `END Marked ${label} as complete for today. Great job!`;
    }
    if (answer === '2') {
      return `END No problem — come back and mark it when it's done.`;
    }
    return `END Invalid selection. Please dial in again.`;
  }

  if (branch === '2') {
    if (rest.length === 1) {
      return `CON Mark today's session as done?\n1. Yes\n2. No`;
    }
    const answer = rest[1];
    if (answer === '1') {
      markToday(phoneNumber);
      return `END Marked as done for today. Great job!`;
    }
    if (answer === '2') {
      return `END Okay, not marked.`;
    }
    return `END Invalid selection. Please dial in again.`;
  }

  if (branch === '3') {
    return `END ${weeklyProgressText(phoneNumber)}`;
  }

  if (branch === '4') {
    return `END YOUR GOAL\n\nComplete therapy exercises at least 5 days per week.\n\nAsk your therapist to update this goal at your next visit.`;
  }

  return `END Invalid selection. Please dial in again.`;
}


// ---------------------------------------------------------
// SECTION 6: Calendar & Reminders (menu option 5)
// ---------------------------------------------------------
const reminderSubscribers = new Set();

function handleCalendarReminders(rest, phoneNumber) {
  if (rest.length === 0) {
    return `CON Calendar & Reminders\n1. My Next Appointment\n2. Confirm/Reschedule\n3. Daily Reminder Subscription\n4. Community Programs Near Me`;
  }

  const branch = rest[0];

  if (branch === '1') {
    // PLACEHOLDER — wire this up to real appointment data later.
    return `END Your next appointment: PLACEHOLDER DATE. Please confirm with your clinic. (Live appointment data coming soon.)`;
  }

  if (branch === '2') {
    if (rest.length === 1) {
      return `CON Confirm or reschedule your appointment?\n1. Confirm\n2. Reschedule`;
    }
    const answer = rest[1];
    if (answer === '1') return `END Appointment confirmed. See you then!`;
    if (answer === '2') return `END We'll contact you shortly to reschedule.`;
    return `END Invalid selection. Please dial in again.`;
  }

  if (branch === '3') {
    if (rest.length === 1) {
      return `CON Daily reminders?\n1. Subscribe\n2. Unsubscribe`;
    }
    const answer = rest[1];
    if (answer === '1') {
      reminderSubscribers.add(phoneNumber);
      return `END Subscribed! You'll get a daily SMS exercise reminder.`;
    }
    if (answer === '2') {
      reminderSubscribers.delete(phoneNumber);
      return `END Unsubscribed from daily reminders.`;
    }
    return `END Invalid selection. Please dial in again.`;
  }

  if (branch === '4') {
    if (rest.length === 1) {
      return `CON ${countyMenuText()}`;
    }
    const county = NEARBY_DATA[rest[1]];
    if (!county) return `END Invalid selection. Please dial in again.`;
    // PLACEHOLDER — replace with real upcoming program listings.
    return `END Community programs in ${county.name}: PLACEHOLDER — listings coming soon. Full details will be sent by SMS.`;
  }

  return `END Invalid selection. Please dial in again.`;
}


// ---------------------------------------------------------
// SECTION 7: Emergency/Helpline (menu option 6)
// ---------------------------------------------------------
// ⚠️ PLACEHOLDER NUMBERS — verify and replace before launch. This
// section carries real safety weight, so double-check everything.
function handleEmergency(rest) {
  if (rest.length === 0) {
    return `CON Emergency/Helpline\n1. CP Support Organizations\n2. Nearest Hospital Emergency Line`;
  }
  if (rest[0] === '1') {
    return `END CP SUPPORT\n\nPLACEHOLDER Organization Name: +254 PLACEHOLDER\n\n(Verify and replace with a real, current CP support helpline before launch.)`;
  }
  if (rest[0] === '2') {
    return `END EMERGENCY\n\nNational Emergency: 999 or 112\n\nFor a specific hospital, use 'Find Nearby Help' from the main menu.`;
  }
  return `END Invalid selection. Please dial in again.`;
}


// ---------------------------------------------------------
// SECTION 8: Language (menu option 7)
// ---------------------------------------------------------
function handleLanguage(rest) {
  if (rest.length === 0) {
    return `CON Language\n1. English\n2. Kiswahili\n3. Gikuyu`;
  }
  if (rest[0] === '1') return `END Language set to English.`;
  if (rest[0] === '2') return `END Lugha imewekwa kuwa Kiswahili.`;
  if (rest[0] === '3') return `END Rurugamo rwathurirwo ni Gikuyu.`;
  return `END Invalid selection. Please dial in again.`;
}


// ---------------------------------------------------------
// SECTION 9: Main dispatcher
// ---------------------------------------------------------
const MAIN_MENU_TEXT =
  'WELCOME TO NEURO-BRIDGE\n1. Therapy & Exercises\n2. Daily Progress\n3. Caregiver Tips\n4. Find Nearby Help\n5. Calendar & Reminders\n6. Emergency/Helpline\n7. Language';

app.post('/ussd', (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;
  console.log(`Session ${sessionId} from ${phoneNumber}: "${text}"`);

  const steps = text === '' ? [] : text.split('*');
  let responseBody;

  if (steps.length === 0) {
    responseBody = `CON ${MAIN_MENU_TEXT}`;
  } else {
    const branch = steps[0];
    const rest = steps.slice(1);

    switch (branch) {
      case '1':
        responseBody = renderTreeResult(walkTree(exercisesTree, rest));
        break;
      case '2':
        responseBody = handleDailyProgress(rest, phoneNumber);
        break;
      case '3':
        responseBody = renderTreeResult(walkTree(caregiverTipsTree, rest));
        break;
      case '4':
        responseBody = handleFindNearbyHelp(rest);
        break;
      case '5':
        responseBody = handleCalendarReminders(rest, phoneNumber);
        break;
      case '6':
        responseBody = handleEmergency(rest);
        break;
      case '7':
        responseBody = handleLanguage(rest);
        break;
      default:
        responseBody = `END Invalid selection. Please dial in again.`;
    }
  }

  res.set('Content-Type', 'text/plain');
  res.send(responseBody);
});

app.get('/', (req, res) => {
  res.send('Neurobridge USSD server is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
