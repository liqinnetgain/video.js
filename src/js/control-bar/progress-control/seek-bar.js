/**
 * @file seek-bar.js
 */
import Slider from '../../slider/slider.js';
import Component from '../../component.js';
import {IE_VERSION} from '../../utils/browser.js';
import * as Dom from '../../utils/dom.js';
import * as Fn from '../../utils/fn.js';
import formatTime from '../../utils/format-time.js';

import './load-progress-bar.js';
import './play-progress-bar.js';
import './mouse-time-display.js';

// The number of seconds the `step*` functions move the timeline.
const STEP_SECONDS = 5;

/**
 * Seek bar and container for the progress bars. Uses {@link PlayProgressBar}
 * as its `bar`.
 *
 * @extends Slider
 */
class SeekBar extends Slider {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.update = Fn.throttle(Fn.bind(this, this.update), 50);
    this.on(player, ['timeupdate', 'ended'], this.update);
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-progress-holder'
    }, {
      'aria-label': 'progress bar'
    });
  }

  /**
   * Update the seek bar's UI.
   *
   * @param {EventTarget~Event} [event]
   *        The `timeupdate` or `ended` event that caused this to run.
   *
   * @listens Player#timeupdate
   * @listens Player#ended
   */
  update() {
    const percent = super.update();
    const duration = this.player_.duration();

    // Allows for smooth scrubbing, when player can't keep up.
    const time = (this.player_.scrubbing()) ?
      this.player_.getCache().currentTime :
      this.player_.currentTime();

    // machine readable value of progress bar (percentage complete)
    this.el_.setAttribute('aria-valuenow', (percent * 100).toFixed(2));

    // human readable value of progress bar (time complete)
    this.el_.setAttribute('aria-valuetext', formatTime(time, duration));

    // Update the `PlayProgressBar`.
    this.bar.update(Dom.getBoundingClientRect(this.el_), percent);

    return percent;
  }

  /**
   * Get the percentage of media played so far.
   *
   * @return {number}
   *         The percentage of media played so far (0 to 1).
   */
  getPercent() {

    // Allows for smooth scrubbing, when player can't keep up.
    const time = (this.player_.scrubbing()) ?
      this.player_.getCache().currentTime :
      this.player_.currentTime();

    const percent = time / this.player_.duration();

    return percent >= 1 ? 1 : percent;
  }

  /**
   * Handle mouse down on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mousedown` event that caused this to run.
   *
   * @listens mousedown
   */
  handleMouseDown(event) {
    this.player_.scrubbing(true);

    this.videoWasPlaying = !this.player_.paused();
    this.player_.pause();

    super.handleMouseDown(event);
  }

  /**
   * Handle mouse move on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mousemove` event that caused this to run.
   *
   * @listens mousemove
   */
  handleMouseMove(event) {
    let newTime = this.calculateDistance(event) * this.player_.duration();

    // Don't let video end while scrubbing.
    if (newTime === this.player_.duration()) {
      newTime = newTime - 0.1;
    }

    // Set new time (tell player to seek to new time)
    this.player_.currentTime(newTime);
  }

  /**
   * Handle mouse up on seek bar
   *
   * @param {EventTarget~Event} event
   *        The `mouseup` event that caused this to run.
   *
   * @listens mouseup
   */
  handleMouseUp(event) {
    super.handleMouseUp(event);

    this.player_.scrubbing(false);
    if (this.videoWasPlaying) {
      this.player_.play();
    }
  }

  /**
   * Move more quickly fast forward for keyboard-only users
   */
  stepForward() {
    this.player_.currentTime(this.player_.currentTime() + STEP_SECONDS);
  }

  /**
   * Move more quickly rewind for keyboard-only users
   */
  stepBack() {
    this.player_.currentTime(this.player_.currentTime() - STEP_SECONDS);
  }
}

/**
 * Default options for the `SeekBar`
 *
 * @type {Object}
 * @private
 */
SeekBar.prototype.options_ = {
  children: [
    'loadProgressBar',
    'playProgressBar'
  ],
  barName: 'playProgressBar'
};

if (!IE_VERSION || IE_VERSION > 8) {
  SeekBar.prototype.options_.children.splice(1, 0, 'mouseTimeDisplay');
}

/**
 * Call the update event for this Slider when this event happens on the player.
 *
 * @type {string}
 */
SeekBar.prototype.playerEvent = 'timeupdate';

Component.registerComponent('SeekBar', SeekBar);
export default SeekBar;
