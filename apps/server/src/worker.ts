/**
 * Standalone BullMQ worker entry point.
 * Run this in a separate container for background job processing.
 */
import './infrastructure/queue/email-worker.js';

console.log('[Worker] Email worker started and listening for jobs...');
