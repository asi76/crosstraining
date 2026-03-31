// Script to add new exercises to Firebase
// Run with: node add_exercises.js

const https = require('https');

const PROJECT_ID = 'studio-7990555522-7e3ef';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Group IDs mapping
const GROUP_IDS = {
  'chest': 'chest',
  'back': 'back',
  'arms': 'biceps-triceps',
  'shoulders': 'shoulders',
  'core': 'core',
  'legs': 'legs',
  'cardio': 'cardio-hiit'
};

// New exercises to add (10 per group, bodyweight only, not duplicates)
const newExercises = {
  'chest': [
    { name: 'Wide-Grip Push-Up', muscles: ['Chest', 'Shoulders'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 12, description: 'Push-up with hands wider than shoulder-width, emphasizes outer chest.' },
    { name: 'Incline Push-Up', muscles: ['Lower Chest', 'Shoulders'], difficulty: 'beginner', tipo: 'anaerobico', reps: 15, description: 'Hands on elevated surface (bench), lower chest to surface, push back up.' },
    { name: 'Archer Push-Up', muscles: ['Chest', 'Triceps', 'Core'], difficulty: 'advanced', tipo: 'anaerobico', reps: 8, description: 'Wide push-up position, shift weight to one arm, bend that arm while keeping other straight.' },
    { name: 'One-Leg Push-Up', muscles: ['Chest', 'Shoulders', 'Triceps', 'Core'], difficulty: 'advanced', tipo: 'anaerobico', reps: 6, description: 'Push-up with one leg lifted, increases chest and core engagement.' },
    { name: 'Side-to-Side Push-Up', muscles: ['Sides Chest', 'Shoulders', 'Triceps'], difficulty: 'advanced', tipo: 'anaerobico', reps: 8, description: 'Shift body weight from one side to the other while staying low in push-up position.' },
    { name: 'Decline Push-Up', muscles: ['Upper Chest', 'Shoulders', 'Triceps'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 12, description: 'Feet on elevated surface, hands on floor, lower chest toward hands.' },
    { name: 'Spiderman Push-Up', muscles: ['Chest', 'Shoulders', 'Obliques'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'Push-up bringing knee to elbow on same side, alternate.' },
    { name: 'Staggered Push-Up', muscles: ['Chest', 'Shoulders', 'Core'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 12, description: 'Push-up with hands placed at different heights, one higher than other.' },
    { name: 'Planche Push-Up', muscles: ['Chest', 'Shoulders', 'Core'], difficulty: 'advanced', tipo: 'anaerobico', reps: 6, description: 'Push-up performed with body in horizontal position, leaning forward.' },
    { name: 'Bodyweight Chest Press', muscles: ['Chest', 'Shoulders', 'Triceps'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 12, description: 'Push-up position, push body up using chest and arms strength.' }
  ],
  'back': [
    { name: 'Reverse Snow Angels', muscles: ['Lats', 'Rhomboids', 'Rear Delts'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 12, description: 'Lie face down, sweep arms overhead keeping them off ground, then pull back.' },
    { name: 'Wall Slides', muscles: ['Lats', 'Serratus'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'Back against wall in goalpost position, slide arms up and down maintaining contact.' },
    { name: 'Prone Lat Pulls', muscles: ['Lats', 'Rhomboids'], difficulty: 'beginner', tipo: 'anaerobico', reps: 15, description: 'Lie face down, pull elbows down and back toward hips, squeeze shoulder blades.' },
    { name: 'Superman Hold', muscles: ['Lower Back', 'Glutes'], difficulty: 'beginner', tipo: 'anaerobico', duration: 30, description: 'Lie face down, lift arms and legs off floor, hold.' },
    { name: 'W Raises', muscles: ['Rhomboids', 'Rear Delts'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'Lie face down, arms in W position, lift and squeeze shoulder blades.' },
    { name: 'Prone Lateral Raises', muscles: ['Rhomboids', 'Rear Delts'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 12, description: 'Lie face down, arms extended, lift arms keeping them straight.' },
    { name: 'Towel Doorway Rows', muscles: ['Back', 'Biceps'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'Loop towel over door, pull body toward door keeping body straight.' },
    { name: 'Doorway Rows', muscles: ['Back', 'Biceps'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'Grip doorframe, lean back with arms extended, pull body forward.' },
    { name: 'Good Mornings', muscles: ['Lower Back', 'Hamstrings', 'Glutes'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 12, description: 'Stand with feet hip-width, hinge at hips keeping back flat, return to standing.' },
    { name: 'Reverse Plank', muscles: ['Lower Back', 'Glutes', 'Core'], difficulty: 'intermediate', tipo: 'anaerobico', duration: 30, description: 'Sit with hands behind, lift hips to form straight line, hold.' }
  ],
  'arms': [
    { name: 'Bench Dips', muscles: ['Triceps', 'Shoulders'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'Hands on bench edge behind you, lower body by bending elbows to 90 degrees.' },
    { name: 'Reverse Plank Push-Up', muscles: ['Triceps', 'Core', 'Shoulders'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'Reverse plank position, bend elbows to lower body, push back up.' },
    { name: 'Cobra Push-Up', muscles: ['Triceps', 'Chest'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'Lie prone, push through hands to straighten arms, keep hips on floor.' },
    { name: 'Bodyweight Bicep Curl', muscles: ['Biceps', 'Core'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'Push-up position with hands rotated backward, lower and push using biceps.' },
    { name: 'Table Inverted Row', muscles: ['Biceps', 'Back', 'Core'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 12, description: 'Under sturdy table, pull chest to table underside, lower with control.' },
    { name: 'Door Frame Bicep Curl', muscles: ['Biceps'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'Grip doorframe, lean back until arm extended, curl back up using biceps.' },
    { name: 'Inchworm', muscles: ['Biceps', 'Core', 'Chest'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 8, description: 'Stand, bend forward, walk hands to plank, walk feet back to hands.' },
    { name: 'Plank to Push-Up', muscles: ['Triceps', 'Shoulders', 'Core'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'Forearm plank, push up onto hands one arm at a time, alternate lead arm.' },
    { name: 'Triceps Floor Extension', muscles: ['Triceps', 'Chest'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'Lie on stomach, push through hands to lift upper body, elbows stay tucked.' },
    { name: 'Wall Push-Up (Arms)', muscles: ['Triceps', 'Chest', 'Shoulders'], difficulty: 'beginner', tipo: 'anaerobico', reps: 15, description: 'Stand arm\'s length from wall, lean in until elbows at 90 degrees, push back.' }
  ],
  'shoulders': [
    { name: 'Pike Push-Up', muscles: ['Shoulders', 'Triceps', 'Upper Chest'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'Pike position with hips high, lower head toward floor, push back up.' },
    { name: 'Bear Crawl', muscles: ['Shoulders', 'Core', 'Hip Flexors'], difficulty: 'intermediate', tipo: 'anaerobico', duration: 30, description: 'On hands and knees with knees lifted, move forward alternating hand and opposite foot.' },
    { name: 'Lateral Plank Walk', muscles: ['Shoulders', 'Core', 'Glutes'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'High plank position, step sideways with one hand and same-side foot, follow with other.' },
    { name: 'Arm Circles', muscles: ['Shoulders', 'Rear Delts'], difficulty: 'beginner', tipo: 'anaerobico', duration: 30, description: 'Extend arms to sides, make small circles, gradually increase size.' },
    { name: 'Wall Angels', muscles: ['Shoulders', 'Upper Back'], difficulty: 'beginner', tipo: 'anaerobico', reps: 10, description: 'Back against wall in goalpost position, slide arms up and down keeping contact.' },
    { name: 'Shoulder Y-Raise', muscles: ['Shoulders', 'Rear Delts'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'Lie on side, raise arm in Y shape keeping elbow straight.' },
    { name: 'Push-Up Shoulder Taps', muscles: ['Shoulders', 'Core', 'Chest'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'Push-up, at top tap opposite shoulder with one hand, alternate.' },
    { name: 'Plank to Downward Dog', muscles: ['Shoulders', 'Core', 'Hamstrings'], difficulty: 'beginner', tipo: 'anaerobico', reps: 10, description: 'From plank, push hips up and back into downward dog, return to plank.' },
    { name: 'Single Arm Side Plank Rotation', muscles: ['Shoulders', 'Obliques', 'Core'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 8, description: 'Side plank, rotate torso reaching top arm under body, return.' },
    { name: 'Scapular Push-Up', muscles: ['Shoulders', 'Upper Back'], difficulty: 'beginner', tipo: 'anaerobico', reps: 15, description: 'Push-up position, protract and retract shoulder blades without moving arms.' }
  ],
  'core': [
    { name: 'Dead Bug', muscles: ['Abs', 'Lower Back'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'Lie on back, extend opposite arm and leg while keeping lower back flat.' },
    { name: 'Bird Dog', muscles: ['Core', 'Lower Back', 'Glutes'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'On hands and knees, extend opposite arm and leg, hold, return.' },
    { name: 'Hollow Body Hold', muscles: ['Abs', 'Hip Flexors'], difficulty: 'intermediate', tipo: 'anaerobico', duration: 30, description: 'Lie on back, lift shoulders and legs off floor, hold body in V shape.' },
    { name: 'Toe Touch', muscles: ['Lower Abs'], difficulty: 'beginner', tipo: 'anaerobico', reps: 15, description: 'Lie on back, lift legs to vertical, reach hands toward toes.' },
    { name: 'Reverse Crunch', muscles: ['Lower Abs'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 15, description: 'Lie on back, lift hips off floor by contracting lower abs.' },
    { name: 'Plank Shoulder Taps', muscles: ['Abs', 'Obliques', 'Shoulders'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'Plank position, tap shoulders alternating hands while maintaining hip stability.' },
    { name: 'Side Plank Dips', muscles: ['Obliques', 'Abs'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 12, description: 'Side plank, lower hips toward floor then lift, repeat on each side.' },
    { name: 'Body Saw', muscles: ['Abs', 'Shoulders', 'Chest'], difficulty: 'advanced', tipo: 'anaerobico', reps: 10, description: 'Plank position, push body forward and back using arms only.' },
    { name: 'L-Sit Hold', muscles: ['Abs', 'Hip Flexors', 'Quads'], difficulty: 'advanced', tipo: 'anaerobico', duration: 15, description: 'Sit with hands on floor, lift body and legs to form L shape, hold.' },
    { name: 'Windshield Wipers', muscles: ['Obliques', 'Abs'], difficulty: 'advanced', tipo: 'anaerobico', reps: 8, description: 'Hanging or supported L-sit, rotate legs side to side like windshield wipers.' }
  ],
  'legs': [
    { name: 'Pistol Squat', muscles: ['Quads', 'Glutes', 'Balance'], difficulty: 'advanced', tipo: 'anaerobico', reps: 5, description: 'Stand on one leg, extend other leg forward, squat until thigh is parallel, stand back up.' },
    { name: 'Lateral Lunge', muscles: ['Quads', 'Glutes', 'Adductors'], difficulty: 'beginner', tipo: 'anaerobico', reps: 12, description: 'Step sideways, keep one leg straight, lower hips by bending stepping knee.' },
    { name: 'Sumo Squat', muscles: ['Quads', 'Glutes', 'Adductors'], difficulty: 'beginner', tipo: 'anaerobico', reps: 15, description: 'Stand with feet wider than shoulder-width, toes out, squat down.' },
    { name: 'Curtsy Lunge', muscles: ['Glutes', 'Quads', 'Hamstrings'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 12, description: 'Step one leg diagonally behind the other, lower hips, alternate sides.' },
    { name: 'Single-Leg Deadlift', muscles: ['Hamstrings', 'Glutes', 'Balance'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'Stand on one leg, hinge forward extending other leg back, return.' },
    { name: 'Glute Kickback', muscles: ['Glutes', 'Hamstrings'], difficulty: 'beginner', tipo: 'anaerobico', reps: 15, description: 'On hands and knees, kick one leg straight back and up, squeeze glute.' },
    { name: 'Fire Hydrant', muscles: ['Glutes', 'Hip Abductors'], difficulty: 'beginner', tipo: 'anaerobico', reps: 15, description: 'On hands and knees, lift one leg out to side keeping knee bent.' },
    { name: 'Donkey Kicks', muscles: ['Glutes', 'Hamstrings'], difficulty: 'beginner', tipo: 'anaerobico', reps: 15, description: 'On hands and knees, kick one leg up behind you, squeezing glute at top.' },
    { name: 'Wall Sit Hold', muscles: ['Quads', 'Glutes'], difficulty: 'intermediate', tipo: 'anaerobico', duration: 45, description: 'Lean against wall, slide down until knees at 90 degrees, hold.' },
    { name: 'Step-Up to Balance', muscles: ['Quads', 'Glutes', 'Balance'], difficulty: 'intermediate', tipo: 'anaerobico', reps: 10, description: 'Step up onto elevated surface, bring other knee up, step down, alternate.' }
  ],
  'cardio': [
    { name: 'Squat Jacks', muscles: ['Quads', 'Glutes', 'Cardio'], difficulty: 'intermediate', tipo: 'aerobico', reps: 15, description: 'Jump feet out to squat position, jump feet back together.' },
    { name: 'Mountain Climbers', muscles: ['Abs', 'Hip Flexors', 'Cardio'], difficulty: 'intermediate', tipo: 'aerobico', duration: 30, description: 'Plank position, drive knees alternately toward chest rapidly.' },
    { name: 'High Knees', muscles: ['Hip Flexors', 'Quads', 'Cardio'], difficulty: 'beginner', tipo: 'aerobico', duration: 30, description: 'Run in place bringing knees up to hip level.' },
    { name: 'Butt Kicks', muscles: ['Hamstrings', 'Cardio'], difficulty: 'beginner', tipo: 'aerobico', duration: 30, description: 'Run in place kicking heels up toward glutes.' },
    { name: 'Jumping Jacks', muscles: ['Full Body', 'Cardio'], difficulty: 'beginner', tipo: 'aerobico', duration: 45, description: 'Jump feet out while raising arms overhead, jump back.' },
    { name: 'Skaters', muscles: ['Glutes', 'Quads', 'Cardio'], difficulty: 'intermediate', tipo: 'aerobico', reps: 20, description: 'Jump laterally from one foot to the other, like skating.' },
    { name: 'Burpees', muscles: ['Full Body', 'Cardio'], difficulty: 'advanced', tipo: 'aerobico', reps: 10, description: 'Squat, jump back to plank, push-up, jump feet forward, jump up.' },
    { name: 'Tuck Jumps', muscles: ['Quads', 'Glutes', 'Cardio'], difficulty: 'advanced', tipo: 'aerobico', reps: 10, description: 'Jump up, bring knees up toward chest at peak, land softly.' },
    { name: 'Fast Feet', muscles: ['Legs', 'Cardio'], difficulty: 'beginner', tipo: 'aerobico', duration: 30, description: 'Quickly shift feet back and forth in small movements.' },
    { name: 'Cross Jacks', muscles: ['Full Body', 'Cardio'], difficulty: 'intermediate', tipo: 'aerobico', duration: 30, description: 'Jumping jack motion but cross legs alternating in front.' }
  ]
};

async function addDocument(collection, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      fields: {
        name: { stringValue: data.name },
        group_id: { stringValue: data.group_id },
        muscles: { arrayValue: { values: data.muscles.map(m => ({ stringValue: m })) } },
        difficulty: { stringValue: data.difficulty },
        tipo: { stringValue: data.tipo },
        reps: data.reps ? { integerValue: data.reps.toString() } : { nullValue: null },
        duration: data.duration ? { integerValue: data.duration.toString() } : { nullValue: null },
        description: { stringValue: data.description || '' }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?key=AIzaSyBRASV4u7AwfFjfdn1m2m2hJG2TmW_RQ4UUQ`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('Adding new exercises to Firebase...\n');
  
  for (const [groupKey, exercises] of Object.entries(newExercises)) {
    const groupId = GROUP_IDS[groupKey];
    console.log(`\n=== ${groupKey.toUpperCase()} (${groupId}) ===`);
    
    for (const ex of exercises) {
      const data = { ...ex, group_id: groupId };
      try {
        const result = await addDocument('exercises', data);
        const docId = result.name.split('/').pop();
        console.log(`✓ ${ex.name} (${docId})`);
      } catch (err) {
        console.error(`✗ ${ex.name}: ${err.message}`);
      }
    }
  }
  
  console.log('\n\nDone!');
}

main().catch(console.error);
