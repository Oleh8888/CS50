/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, range_1, model_1, textModel_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FindDecorations {
        constructor(editor) {
            this._editor = editor;
            this._decorations = [];
            this._overviewRulerApproximateDecorations = [];
            this._findScopeDecorationId = null;
            this._rangeHighlightDecorationId = null;
            this._highlightedDecorationId = null;
            this._startPosition = this._editor.getPosition();
        }
        dispose() {
            this._editor.deltaDecorations(this._allDecorations(), []);
            this._decorations = [];
            this._overviewRulerApproximateDecorations = [];
            this._findScopeDecorationId = null;
            this._rangeHighlightDecorationId = null;
            this._highlightedDecorationId = null;
        }
        reset() {
            this._decorations = [];
            this._overviewRulerApproximateDecorations = [];
            this._findScopeDecorationId = null;
            this._rangeHighlightDecorationId = null;
            this._highlightedDecorationId = null;
        }
        getCount() {
            return this._decorations.length;
        }
        getFindScope() {
            if (this._findScopeDecorationId) {
                return this._editor.getModel().getDecorationRange(this._findScopeDecorationId);
            }
            return null;
        }
        getStartPosition() {
            return this._startPosition;
        }
        setStartPosition(newStartPosition) {
            this._startPosition = newStartPosition;
            this.setCurrentFindMatch(null);
        }
        _getDecorationIndex(decorationId) {
            const index = this._decorations.indexOf(decorationId);
            if (index >= 0) {
                return index + 1;
            }
            return 1;
        }
        getCurrentMatchesPosition(desiredRange) {
            let candidates = this._editor.getModel().getDecorationsInRange(desiredRange);
            for (const candidate of candidates) {
                const candidateOpts = candidate.options;
                if (candidateOpts === FindDecorations._FIND_MATCH_DECORATION || candidateOpts === FindDecorations._CURRENT_FIND_MATCH_DECORATION) {
                    return this._getDecorationIndex(candidate.id);
                }
            }
            return 1;
        }
        setCurrentFindMatch(nextMatch) {
            let newCurrentDecorationId = null;
            let matchPosition = 0;
            if (nextMatch) {
                for (let i = 0, len = this._decorations.length; i < len; i++) {
                    let range = this._editor.getModel().getDecorationRange(this._decorations[i]);
                    if (nextMatch.equalsRange(range)) {
                        newCurrentDecorationId = this._decorations[i];
                        matchPosition = (i + 1);
                        break;
                    }
                }
            }
            if (this._highlightedDecorationId !== null || newCurrentDecorationId !== null) {
                this._editor.changeDecorations((changeAccessor) => {
                    if (this._highlightedDecorationId !== null) {
                        changeAccessor.changeDecorationOptions(this._highlightedDecorationId, FindDecorations._FIND_MATCH_DECORATION);
                        this._highlightedDecorationId = null;
                    }
                    if (newCurrentDecorationId !== null) {
                        this._highlightedDecorationId = newCurrentDecorationId;
                        changeAccessor.changeDecorationOptions(this._highlightedDecorationId, FindDecorations._CURRENT_FIND_MATCH_DECORATION);
                    }
                    if (this._rangeHighlightDecorationId !== null) {
                        changeAccessor.removeDecoration(this._rangeHighlightDecorationId);
                        this._rangeHighlightDecorationId = null;
                    }
                    if (newCurrentDecorationId !== null) {
                        let rng = this._editor.getModel().getDecorationRange(newCurrentDecorationId);
                        if (rng.startLineNumber !== rng.endLineNumber && rng.endColumn === 1) {
                            let lineBeforeEnd = rng.endLineNumber - 1;
                            let lineBeforeEndMaxColumn = this._editor.getModel().getLineMaxColumn(lineBeforeEnd);
                            rng = new range_1.Range(rng.startLineNumber, rng.startColumn, lineBeforeEnd, lineBeforeEndMaxColumn);
                        }
                        this._rangeHighlightDecorationId = changeAccessor.addDecoration(rng, FindDecorations._RANGE_HIGHLIGHT_DECORATION);
                    }
                });
            }
            return matchPosition;
        }
        set(findMatches, findScope) {
            this._editor.changeDecorations((accessor) => {
                let findMatchesOptions = FindDecorations._FIND_MATCH_DECORATION;
                let newOverviewRulerApproximateDecorations = [];
                if (findMatches.length > 1000) {
                    // we go into a mode where the overview ruler gets "approximate" decorations
                    // the reason is that the overview ruler paints all the decorations in the file and we don't want to cause freezes
                    findMatchesOptions = FindDecorations._FIND_MATCH_NO_OVERVIEW_DECORATION;
                    // approximate a distance in lines where matches should be merged
                    const lineCount = this._editor.getModel().getLineCount();
                    const height = this._editor.getLayoutInfo().height;
                    const approxPixelsPerLine = height / lineCount;
                    const mergeLinesDelta = Math.max(2, Math.ceil(3 / approxPixelsPerLine));
                    // merge decorations as much as possible
                    let prevStartLineNumber = findMatches[0].range.startLineNumber;
                    let prevEndLineNumber = findMatches[0].range.endLineNumber;
                    for (let i = 1, len = findMatches.length; i < len; i++) {
                        const range = findMatches[i].range;
                        if (prevEndLineNumber + mergeLinesDelta >= range.startLineNumber) {
                            if (range.endLineNumber > prevEndLineNumber) {
                                prevEndLineNumber = range.endLineNumber;
                            }
                        }
                        else {
                            newOverviewRulerApproximateDecorations.push({
                                range: new range_1.Range(prevStartLineNumber, 1, prevEndLineNumber, 1),
                                options: FindDecorations._FIND_MATCH_ONLY_OVERVIEW_DECORATION
                            });
                            prevStartLineNumber = range.startLineNumber;
                            prevEndLineNumber = range.endLineNumber;
                        }
                    }
                    newOverviewRulerApproximateDecorations.push({
                        range: new range_1.Range(prevStartLineNumber, 1, prevEndLineNumber, 1),
                        options: FindDecorations._FIND_MATCH_ONLY_OVERVIEW_DECORATION
                    });
                }
                // Find matches
                let newFindMatchesDecorations = new Array(findMatches.length);
                for (let i = 0, len = findMatches.length; i < len; i++) {
                    newFindMatchesDecorations[i] = {
                        range: findMatches[i].range,
                        options: findMatchesOptions
                    };
                }
                this._decorations = accessor.deltaDecorations(this._decorations, newFindMatchesDecorations);
                // Overview ruler approximate decorations
                this._overviewRulerApproximateDecorations = accessor.deltaDecorations(this._overviewRulerApproximateDecorations, newOverviewRulerApproximateDecorations);
                // Range highlight
                if (this._rangeHighlightDecorationId) {
                    accessor.removeDecoration(this._rangeHighlightDecorationId);
                    this._rangeHighlightDecorationId = null;
                }
                // Find scope
                if (this._findScopeDecorationId) {
                    accessor.removeDecoration(this._findScopeDecorationId);
                    this._findScopeDecorationId = null;
                }
                if (findScope) {
                    this._findScopeDecorationId = accessor.addDecoration(findScope, FindDecorations._FIND_SCOPE_DECORATION);
                }
            });
        }
        matchBeforePosition(position) {
            if (this._decorations.length === 0) {
                return null;
            }
            for (let i = this._decorations.length - 1; i >= 0; i--) {
                let decorationId = this._decorations[i];
                let r = this._editor.getModel().getDecorationRange(decorationId);
                if (!r || r.endLineNumber > position.lineNumber) {
                    continue;
                }
                if (r.endLineNumber < position.lineNumber) {
                    return r;
                }
                if (r.endColumn > position.column) {
                    continue;
                }
                return r;
            }
            return this._editor.getModel().getDecorationRange(this._decorations[this._decorations.length - 1]);
        }
        matchAfterPosition(position) {
            if (this._decorations.length === 0) {
                return null;
            }
            for (let i = 0, len = this._decorations.length; i < len; i++) {
                let decorationId = this._decorations[i];
                let r = this._editor.getModel().getDecorationRange(decorationId);
                if (!r || r.startLineNumber < position.lineNumber) {
                    continue;
                }
                if (r.startLineNumber > position.lineNumber) {
                    return r;
                }
                if (r.startColumn < position.column) {
                    continue;
                }
                return r;
            }
            return this._editor.getModel().getDecorationRange(this._decorations[0]);
        }
        _allDecorations() {
            let result = [];
            result = result.concat(this._decorations);
            result = result.concat(this._overviewRulerApproximateDecorations);
            if (this._findScopeDecorationId) {
                result.push(this._findScopeDecorationId);
            }
            if (this._rangeHighlightDecorationId) {
                result.push(this._rangeHighlightDecorationId);
            }
            return result;
        }
    }
    FindDecorations._CURRENT_FIND_MATCH_DECORATION = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        zIndex: 13,
        className: 'currentFindMatch',
        showIfCollapsed: true,
        overviewRuler: {
            color: themeService_1.themeColorFromId(colorRegistry_1.overviewRulerFindMatchForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: themeService_1.themeColorFromId(colorRegistry_1.minimapFindMatch),
            position: model_1.MinimapPosition.Inline
        }
    });
    FindDecorations._FIND_MATCH_DECORATION = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'findMatch',
        showIfCollapsed: true,
        overviewRuler: {
            color: themeService_1.themeColorFromId(colorRegistry_1.overviewRulerFindMatchForeground),
            position: model_1.OverviewRulerLane.Center
        },
        minimap: {
            color: themeService_1.themeColorFromId(colorRegistry_1.minimapFindMatch),
            position: model_1.MinimapPosition.Inline
        }
    });
    FindDecorations._FIND_MATCH_NO_OVERVIEW_DECORATION = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'findMatch',
        showIfCollapsed: true
    });
    FindDecorations._FIND_MATCH_ONLY_OVERVIEW_DECORATION = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        overviewRuler: {
            color: themeService_1.themeColorFromId(colorRegistry_1.overviewRulerFindMatchForeground),
            position: model_1.OverviewRulerLane.Center
        }
    });
    FindDecorations._RANGE_HIGHLIGHT_DECORATION = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'rangeHighlight',
        isWholeLine: true
    });
    FindDecorations._FIND_SCOPE_DECORATION = textModel_1.ModelDecorationOptions.register({
        className: 'findScope',
        isWholeLine: true
    });
    exports.FindDecorations = FindDecorations;
});
//# sourceMappingURL=findDecorations.js.map