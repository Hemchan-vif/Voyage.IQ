"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idValidation = exports.itineraryValidation = exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
exports.registerValidation = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('role').isIn(['Traveler', 'Admin']).withMessage('Role must be Traveler or Admin'),
    (0, express_validator_1.body)('contact_info').optional().trim()
];
exports.loginValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
];
exports.itineraryValidation = [
    (0, express_validator_1.body)('destination').trim().notEmpty().withMessage('Destination is required'),
    (0, express_validator_1.body)('start_date').isISO8601().withMessage('Valid start date is required'),
    (0, express_validator_1.body)('end_date').isISO8601().withMessage('Valid end date is required')
        .custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.start_date)) {
            throw new Error('End date must be after start date');
        }
        return true;
    }),
    (0, express_validator_1.body)('budget').isFloat({ min: 0.01 }).withMessage('Budget must be greater than zero'),
    (0, express_validator_1.body)('activities').optional().isArray().withMessage('Activities must be an array'),
    (0, express_validator_1.body)('notes').optional().trim(),
    (0, express_validator_1.body)('preferences').optional().trim()
];
exports.idValidation = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Invalid ID')
];
