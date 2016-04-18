import {Feature} from './feature';
import {Hash} from './hash';
import {Storage} from './storage';
import Str from '../string';
import Types from '../types';

/**
 * Reflects the state of features to be persisted via hash, localStorage or
 * cookie
 *
 * @export
 * @class State
 * @extends {Feature}
 */
export class State extends Feature {

    /**
     * Creates an instance of State
     *
     * @param {TableFilter} tf TableFilter instance
     */
    constructor(tf) {
        super(tf, 'state');

        let cfg = this.config.state;

        this.enableHash = cfg === true ||
            (Types.isObj(cfg.types) && cfg.types.indexOf('hash') !== -1);
        this.enableLocalStorage = Types.isObj(cfg.types) &&
            cfg.types.indexOf('local_storage') !== -1;
        this.enableCookie = Types.isObj(cfg.types) &&
            cfg.types.indexOf('cookie') !== -1;
        this.persistFilters = cfg.filters === false ? false : true;
        this.persistPageNumber = Boolean(cfg.page_number);
        this.persistPageLength = Boolean(cfg.page_length);
        this.persistSort = Boolean(cfg.sort);
        this.persistColsVisibility = Boolean(cfg.columns_visibility);
        this.cookieDuration = !isNaN(cfg.cookie_duration) ?
            parseInt(cfg.cookie_duration, 10) : 87600;

        this.enableStorage = this.enableLocalStorage || this.enableCookie;
        this.hash = null;
        this.pageNb = null;
        this.pageLength = null;
        this.sort = null;
        this.hiddenCols = null;

        this.state = {};
        this.prfxCol = 'col_';
        this.pageNbKey = 'page';
        this.pageLengthKey = 'page_length';
    }

    /**
     * Initializes the State object
     */
    init() {
        if (this.initialized) {
            return;
        }

        this.emitter.on(['after-filtering'], () => this.update());
        this.emitter.on(['after-page-change', 'after-clearing-filters'],
            (tf, pageNb) => this.updatePage(pageNb));
        this.emitter.on(['after-page-length-change'],
            (tf, pageLength) => this.updatePageLength(pageLength));
        this.emitter.on(['column-sorted'],
            (tf, index, descending) => this.updateSort(index, descending));
        this.emitter.on(['sort-initialized'], () => this._syncSort());
        this.emitter.on(['colsVisibility-initialized'],
            () => this._syncColsVisibility());
        this.emitter.on(['column-shown', 'column-hidden'], (tf, feature,
            colIndex, hiddenCols) => this.updateColsVisibility(hiddenCols));

        if (this.enableHash) {
            this.hash = new Hash(this);
            this.hash.init();
        }
        if (this.enableStorage) {
            this.storage = new Storage(this);
            this.storage.init();
        }
        this.initialized = true;
    }


    /**
     * Update state object based on current features state
     */
    update() {
        if (!this.isEnabled()) {
            return;
        }
        let state = this.state;
        let tf = this.tf;

        if (this.persistFilters) {
            let filterValues = tf.getFiltersValue();

            filterValues.forEach((val, idx) => {
                let key = `${this.prfxCol}${idx}`;

                if (Types.isString(val) && Str.isEmpty(val)) {
                    if (state.hasOwnProperty(key)) {
                        state[key].flt = undefined;
                    }
                } else {
                    state[key] = state[key] || {};
                    state[key].flt = val;
                }
            });
        }

        if (this.persistPageNumber) {
            if (Types.isNull(this.pageNb)) {
                state[this.pageNbKey] = undefined;
            } else {
                state[this.pageNbKey] = this.pageNb;
            }
        }

        if (this.persistPageLength) {
            if (Types.isNull(this.pageLength)) {
                state[this.pageLengthKey] = undefined;
            } else {
                state[this.pageLengthKey] = this.pageLength;
            }
        }

        if (this.persistSort) {
            if (!Types.isNull(this.sort)) {
                // Remove previuosly sorted column
                Object.keys(state).forEach((key) => {
                    if (key.indexOf(this.prfxCol) !== -1 && state[key]) {
                        state[key].sort = undefined;
                    }
                });

                let key = `${this.prfxCol}${this.sort.column}`;
                state[key] = state[key] || {};
                state[key].sort = { descending: this.sort.descending };
            }
        }

        if(this.persistColsVisibility){
            if (!Types.isNull(this.hiddenCols)) {
                console.log(this.hiddenCols);
                // Remove previuosly hidden columns
                Object.keys(state).forEach((key) => {
                    if (key.indexOf(this.prfxCol) !== -1 && state[key]) {
                        state[key].hidden = undefined;
                    }
                });

                this.hiddenCols.forEach((colIdx) => {
                    let key = `${this.prfxCol}${colIdx}`;
                    state[key] = state[key] || {};
                    state[key].hidden = true;
                });
                console.log(state);
            }
        }

        this.emitter.emit('state-changed', tf, state);
    }

    /**
     * Refresh page number field on page number change
     *
     * @param pageNb Current page number
     */
    updatePage(pageNb) {
        this.pageNb = pageNb;
        this.update();
    }

    /**
     * Refresh page length field on page length change
     *
     * @param pageLength Current page length value
     */
    updatePageLength(pageLength) {
        this.pageLength = pageLength;
        this.update();
    }

    /**
     * Refresh column sorting information on sort change
     *
     * @param index {Number} Column index
     * @param descending {Boolean} Descending manner
     */
    updateSort(index, descending) {
        this.sort = {
            column: index,
            descending: descending
        };
        this.update();
    }

    updateColsVisibility(hiddenCols){console.log(hiddenCols);
        this.hiddenCols = hiddenCols;
        this.update();
    }

    /**
     * Override state field
     *
     * @param state State object
     */
    override(state) {
        this.state = state;
    }

    /**
     * Sync stored features state
     */
    sync() {
        let state = this.state;
        let tf = this.tf;

        this._syncFilters();

        if (this.persistPageNumber) {
            let pageNumber = state[this.pageNbKey];
            this.emitter.emit('change-page', tf, pageNumber);
        }

        if (this.persistPageLength) {
            let pageLength = state[this.pageLengthKey];
            this.emitter.emit('change-page-results', tf, pageLength);
        }

        this._syncSort();
        this._syncColsVisibility();
    }

    /**
     * Override current state with passed one and sync features
     *
     * @param state State object
     */
    overrideAndSync(state) {
        // To prevent state to react to features changes, state is temporarily
        // disabled
        this.disable();
        // State is overriden with passed state object
        this.override(state);
        // New hash state is applied to features
        this.sync();
        // State is re-enabled
        this.enable();
    }

    /**
     * Sync filters with stored values and filter table
     *
     * @private
     */
    _syncFilters() {
        if (!this.persistFilters) {
            return;
        }
        let state = this.state;
        let tf = this.tf;

        Object.keys(state).forEach((key) => {
            if (key.indexOf(this.prfxCol) !== -1) {
                let colIdx = parseInt(key.replace(this.prfxCol, ''), 10);
                let val = state[key].flt;
                tf.setFilterValue(colIdx, val);
            }
        });

        tf.filter();
    }

    /**
     * Sync sorted column with stored sorting information and sort table
     *
     * @private
     */
    _syncSort() {
        if (!this.persistSort) {
            return;
        }
        let state = this.state;
        let tf = this.tf;

        Object.keys(state).forEach((key) => {
            if (key.indexOf(this.prfxCol) !== -1) {
                let colIdx = parseInt(key.replace(this.prfxCol, ''), 10);
                if (!Types.isUndef(state[key].sort)) {
                    let sort = state[key].sort;
                    this.emitter.emit('sort', tf, colIdx, sort.descending);
                }
            }
        });
    }

    _syncColsVisibility(){console.log('init', this.state);
        if(!this.persistColsVisibility){
            return;
        }
        let state = this.state;
        let tf = this.tf;

        Object.keys(state).forEach((key) => {
            if (key.indexOf(this.prfxCol) !== -1) {
                let colIdx = parseInt(key.replace(this.prfxCol, ''), 10);
                if (!Types.isUndef(state[key].hidden)) {
                    let feature = tf.extension('colsVisibility');
                    console.log(feature);
                    // feature.hiddenCols.push(colIdx);
                    // let hidden = state[key].hidden;
                    console.log('hide', colIdx);
                    this.emitter.emit('hide-column', tf, colIdx);
                }
            }
        });
    }

    /**
     * Destroy State instance
     */
    destroy() {
        if (!this.initialized) {
            return;
        }

        this.state = {};

        this.emitter.off(['after-filtering'], () => this.update());
        this.emitter.off(['after-page-change', 'after-clearing-filters'],
            (tf, pageNb) => this.updatePage(pageNb));
        this.emitter.off(['after-page-length-change'],
            (tf, index) => this.updatePageLength(index));
        this.emitter.off(['column-sorted'],
            (tf, index, descending) => this.updateSort(index, descending));
        this.emitter.off(['sort-initialized'], () => this._syncSort());
        this.emitter.off(['colsVisibility-initialized'],
            () => this._syncColsVisibility());
        this.emitter.off(['column-shown', 'column-hidden'], (tf, feature,
            colIndex, hiddenCols) => this.updateColsVisibility(hiddenCols));

        if (this.enableHash) {
            this.hash.destroy();
            this.hash = null;
        }

        if (this.enableStorage) {
            this.storage.destroy();
            this.storage = null;
        }

        this.initialized = false;
    }
}
