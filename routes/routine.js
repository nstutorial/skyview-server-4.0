const express = require('express');
const router = express.Router();
const Routine = require('../models/Routine');
const auth = require('../middleware/auth');

// POST /api/routines/save-routine
router.post('/save-routine', auth, async (req, res) => {
  try {
    const { class: className, day, periods } = req.body;

    // Validation
    if (!className || !day || !periods) {
      return res.status(400).json({ 
        message: 'Missing required fields: class, day, periods' 
      });
    }

    // Find routine for the class
    let routine = await Routine.findOne({ class: className });

    if (!routine) {
      // No routine for class: create new
      routine = new Routine({
        class: className,
        schedule: [{ day, periods }]
      });
    } else {
      // Class exists: check if day exists
      const dayIndex = routine.schedule.findIndex(s => s.day === day);

      if (dayIndex !== -1) {
        // Day exists: update periods
        routine.schedule[dayIndex].periods = periods;
      } else {
        // Day doesn't exist: push new day
        routine.schedule.push({ day, periods });
      }
    }

    await routine.save();
    res.status(200).json({ 
      message: 'Routine saved/updated successfully', 
      routine 
    });

  } catch (err) {
    console.error('Error saving routine:', err);
    res.status(500).json({ 
      error: 'Server error saving routine',
      message: err.message 
    });
  }
});

// GET /api/routines/get-routine?day=Monday
router.get('/get-routine', auth, async (req, res) => {
  try {
    const { day: dayName } = req.query;

    if (!dayName) {
      return res.status(400).json({ 
        message: "'day' query parameter is required." 
      });
    }

    // Fetch all routine documents (each one is per class)
    const allRoutines = await Routine.find({});

    // Filter to get only the schedule for the requested day
    const routinesForDay = allRoutines
      .map(routine => {
        const daySchedule = routine.schedule.find(s => s.day === dayName);
        if (daySchedule) {
          return {
            class: routine.class,
            day: daySchedule.day,
            periods: daySchedule.periods
          };
        }
        return null;
      })
      .filter(Boolean); // Remove nulls

    // Response format: { day, routines }
    res.json({ 
      day: dayName, 
      routines: routinesForDay 
    });

  } catch (err) {
    console.error("Error fetching routines:", err);
    res.status(500).json({ 
      error: 'Server error fetching routines',
      message: err.message 
    });
  }
});

module.exports = router;
