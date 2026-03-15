const express = require('express');
const router = express.Router();
const ExamConfig = require('../models/ExamConfig');
const auth = require('../middleware/auth');

// Get exam configuration for a class
router.get('/config/:class/:section/:academicYear', auth, async (req, res) => {
    try {
        const config = await ExamConfig.findOne({
            class: req.params.class,
            section: req.params.section,
            academicYear: req.params.academicYear
        });

        // Default configuration structure
        const defaultConfig = {
            pt1: { maxMarksWritten: 80, maxMarksOral: 20 },
            hy: { maxMarksWritten: 80, maxMarksOral: 20 },
            pt2: { maxMarksWritten: 80, maxMarksOral: 20 },
            final: { maxMarksWritten: 80, maxMarksOral: 20 }
        };

        if (!config) {
            // Return default configuration if none exists
            return res.json(defaultConfig);
        }

        // Convert array format to object format for client compatibility
        const objectConfig = {
            pt1: { maxMarksWritten: 80, maxMarksOral: 20 },
            hy: { maxMarksWritten: 80, maxMarksOral: 20 },
            pt2: { maxMarksWritten: 80, maxMarksOral: 20 },
            final: { maxMarksWritten: 80, maxMarksOral: 20 }
        };

        // If we have examConfigs array, convert it to object format
        if (config.examConfigs && Array.isArray(config.examConfigs)) {
            config.examConfigs.forEach(examConfig => {
                objectConfig[examConfig.examType] = {
                    maxMarksWritten: examConfig.maxMarksWritten,
                    maxMarksOral: examConfig.maxMarksOral
                };
            });
        }

        res.json(objectConfig);
    } catch (error) {
        console.error('Error fetching exam config:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create or update exam configuration
router.post('/config', auth, async (req, res) => {
    try {
        const { class: className, section, academicYear, config } = req.body;

        // Convert config object to array format for storage
        const examConfigs = Object.entries(config).map(([examType, marks]) => ({
            examType,
            maxMarksWritten: marks.maxMarksWritten || 80,
            maxMarksOral: marks.maxMarksOral || 20
        }));

        // Find and update or create new configuration
        const examConfig = await ExamConfig.findOneAndUpdate(
            {
                class: className,
                section: section,
                academicYear: academicYear
            },
            {
                $set: {
                    class: className,
                    section: section,
                    academicYear: academicYear,
                    examConfigs: examConfigs,
                    updatedAt: new Date()
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        // Convert back to object format for response
        const objectConfig = {
            pt1: { maxMarksWritten: 80, maxMarksOral: 20 },
            hy: { maxMarksWritten: 80, maxMarksOral: 20 },
            pt2: { maxMarksWritten: 80, maxMarksOral: 20 },
            final: { maxMarksWritten: 80, maxMarksOral: 20 }
        };

        if (examConfig.examConfigs) {
            examConfig.examConfigs.forEach(examCfg => {
                objectConfig[examCfg.examType] = {
                    maxMarksWritten: examCfg.maxMarksWritten,
                    maxMarksOral: examCfg.maxMarksOral
                };
            });
        }

        res.json(objectConfig);
    } catch (error) {
        console.error('Error saving exam config:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all exam configurations
router.get('/config/all', auth, async (req, res) => {
    try {
        const configs = await ExamConfig.find().sort({ class: 1, section: 1, academicYear: -1 });
        res.json(configs);
    } catch (error) {
        console.error('Error fetching all exam configs:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
