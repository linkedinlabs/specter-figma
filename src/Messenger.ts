import { PLUGIN_NAME } from './constants';

/**
 * @description A class to handle UI alerts, messages, and logging.
 *
 * @class
 * @name Messenger
 *
 * @constructor
 *
 * @property event The encompassing event we are logging or applying a message/alert to.
 * @property page The Figma file that will display messages/alerts
 * or that the log will reference.
 */
export default class Messenger {
  event: any;
  page: PageNode;

  constructor({
    for: event,
    in: page,
  }) {
    this.event = event;
    this.page = page;
  }

  /**
   * @description Takes a string message and logs it at one of 2 levels (normal or error).
   *
   * @kind function
   * @name log
   * @param {string} message The string containing the message to be logged.
   * @param {string} type The optional string declaring the type of log: error or normal (default).
   */
  log(message: string, type: 'normal' | 'error' = 'normal') {
    const logType = type === 'error' ? '🆘' : '👻';
    const pageIdString = this.page ? ` ${this.page.id} :` : '';
    const eventTypeString = this.event && this.event.action ? ` ${this.event.action} :` : ' Invoked :';

    if (process.env.NODE_ENV === 'development') {
      console.log(`${PLUGIN_NAME} ${logType}${pageIdString}${eventTypeString} ${message}`); // eslint-disable-line no-console
    }
  }

  /**
   * @description Takes a string message and renders it as a Toast in the Figma UI.
   *
   * @kind function
   * @name toast
   * @param {string} message The message to be displayed in the Toast.
   */
  toast(message: string) {
    if (this.page) {
      figma.notify(message);
    } else {
      this.log(`Could not display: “${message}”`, 'error');
    }
  }

  /**
   * @description Handle the result messenging/logging.
   *
   * @kind function
   * @name handleResult
   * @param {Object} result The success/error result and accompanying log/toast message(s).
   */
  handleResult(
    result: {
      messages: {
        toast: string,
        log: string,
      },
      status: 'error' | 'success',
    },
  ) {
    if (result.messages) {
      // set up toast and log messages
      const toastMessage = result.messages.toast;
      const logMessage = result.messages.log;
      const isError: boolean = (result.status === 'error');

      // log a message or error
      if (logMessage) {
        this.log(logMessage, isError ? 'error' : null);
      }

      // toast a message or error
      if (toastMessage) {
        this.toast(toastMessage);
      }
    }
  }
}
