// src/middleware/flash.js

/**
 * Flash message middleware for storing messages in session
 * This allows passing messages between redirects
 */
const flashMiddleware = (req, res, next) => {
  // Make flash messages available to all views
  res.locals.messages = req.flash ? {
    success: req.flash('success'),
    error: req.flash('error'),
    info: req.flash('info'),
    warning: req.flash('warning')
  } : {};
  
  // Also make current path available for active menu highlighting
  res.locals.currentPath = req.path;
  
  // Add current user to views
  res.locals.user = req.user;
  
  next();
};

module.exports = flashMiddleware;