/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/editor/common/core/lineTokens", "vs/editor/common/core/position", "vs/editor/common/modes", "vs/editor/common/modes/nullMode", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/editor/common/model/tokensStore"], function (require, exports, arrays, errors_1, lineTokens_1, position_1, modes_1, nullMode_1, lifecycle_1, stopwatch_1, tokensStore_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Constants;
    (function (Constants) {
        Constants[Constants["CHEAP_TOKENIZATION_LENGTH_LIMIT"] = 2048] = "CHEAP_TOKENIZATION_LENGTH_LIMIT";
    })(Constants || (Constants = {}));
    class TokenizationStateStore {
        constructor() {
            this._beginState = [];
            this._valid = [];
            this._len = 0;
            this._invalidLineStartIndex = 0;
        }
        _reset(initialState) {
            this._beginState = [];
            this._valid = [];
            this._len = 0;
            this._invalidLineStartIndex = 0;
            if (initialState) {
                this._setBeginState(0, initialState);
            }
        }
        flush(initialState) {
            this._reset(initialState);
        }
        get invalidLineStartIndex() {
            return this._invalidLineStartIndex;
        }
        _invalidateLine(lineIndex) {
            if (lineIndex < this._len) {
                this._valid[lineIndex] = false;
            }
            if (lineIndex < this._invalidLineStartIndex) {
                this._invalidLineStartIndex = lineIndex;
            }
        }
        _isValid(lineIndex) {
            if (lineIndex < this._len) {
                return this._valid[lineIndex];
            }
            return false;
        }
        getBeginState(lineIndex) {
            if (lineIndex < this._len) {
                return this._beginState[lineIndex];
            }
            return null;
        }
        _ensureLine(lineIndex) {
            while (lineIndex >= this._len) {
                this._beginState[this._len] = null;
                this._valid[this._len] = false;
                this._len++;
            }
        }
        _deleteLines(start, deleteCount) {
            if (deleteCount === 0) {
                return;
            }
            if (start + deleteCount > this._len) {
                deleteCount = this._len - start;
            }
            this._beginState.splice(start, deleteCount);
            this._valid.splice(start, deleteCount);
            this._len -= deleteCount;
        }
        _insertLines(insertIndex, insertCount) {
            if (insertCount === 0) {
                return;
            }
            let beginState = [];
            let valid = [];
            for (let i = 0; i < insertCount; i++) {
                beginState[i] = null;
                valid[i] = false;
            }
            this._beginState = arrays.arrayInsert(this._beginState, insertIndex, beginState);
            this._valid = arrays.arrayInsert(this._valid, insertIndex, valid);
            this._len += insertCount;
        }
        _setValid(lineIndex, valid) {
            this._ensureLine(lineIndex);
            this._valid[lineIndex] = valid;
        }
        _setBeginState(lineIndex, beginState) {
            this._ensureLine(lineIndex);
            this._beginState[lineIndex] = beginState;
        }
        setEndState(linesLength, lineIndex, endState) {
            this._setValid(lineIndex, true);
            this._invalidLineStartIndex = lineIndex + 1;
            // Check if this was the last line
            if (lineIndex === linesLength - 1) {
                return;
            }
            // Check if the end state has changed
            const previousEndState = this.getBeginState(lineIndex + 1);
            if (previousEndState === null || !endState.equals(previousEndState)) {
                this._setBeginState(lineIndex + 1, endState);
                this._invalidateLine(lineIndex + 1);
                return;
            }
            // Perhaps we can skip tokenizing some lines...
            let i = lineIndex + 1;
            while (i < linesLength) {
                if (!this._isValid(i)) {
                    break;
                }
                i++;
            }
            this._invalidLineStartIndex = i;
        }
        setFakeTokens(lineIndex) {
            this._setValid(lineIndex, false);
        }
        //#region Editing
        applyEdits(range, eolCount) {
            const deletingLinesCnt = range.endLineNumber - range.startLineNumber;
            const insertingLinesCnt = eolCount;
            const editingLinesCnt = Math.min(deletingLinesCnt, insertingLinesCnt);
            for (let j = editingLinesCnt; j >= 0; j--) {
                this._invalidateLine(range.startLineNumber + j - 1);
            }
            this._acceptDeleteRange(range);
            this._acceptInsertText(new position_1.Position(range.startLineNumber, range.startColumn), eolCount);
        }
        _acceptDeleteRange(range) {
            const firstLineIndex = range.startLineNumber - 1;
            if (firstLineIndex >= this._len) {
                return;
            }
            this._deleteLines(range.startLineNumber, range.endLineNumber - range.startLineNumber);
        }
        _acceptInsertText(position, eolCount) {
            const lineIndex = position.lineNumber - 1;
            if (lineIndex >= this._len) {
                return;
            }
            this._insertLines(position.lineNumber, eolCount);
        }
    }
    exports.TokenizationStateStore = TokenizationStateStore;
    class TextModelTokenization extends lifecycle_1.Disposable {
        constructor(textModel) {
            super();
            this._textModel = textModel;
            this._tokenizationStateStore = new TokenizationStateStore();
            this._revalidateTokensTimeout = -1;
            this._tokenizationSupport = null;
            this._register(modes_1.TokenizationRegistry.onDidChange((e) => {
                const languageIdentifier = this._textModel.getLanguageIdentifier();
                if (e.changedLanguages.indexOf(languageIdentifier.language) === -1) {
                    return;
                }
                this._resetTokenizationState();
                this._textModel.clearTokens();
            }));
            this._register(this._textModel.onDidChangeRawContentFast((e) => {
                if (e.containsEvent(1 /* Flush */)) {
                    this._resetTokenizationState();
                    return;
                }
            }));
            this._register(this._textModel.onDidChangeContentFast((e) => {
                for (let i = 0, len = e.changes.length; i < len; i++) {
                    const change = e.changes[i];
                    const [eolCount] = tokensStore_1.countEOL(change.text);
                    this._tokenizationStateStore.applyEdits(change.range, eolCount);
                }
                this._beginBackgroundTokenization();
            }));
            this._register(this._textModel.onDidChangeAttached(() => {
                this._beginBackgroundTokenization();
            }));
            this._register(this._textModel.onDidChangeLanguage(() => {
                this._resetTokenizationState();
                this._textModel.clearTokens();
            }));
            this._resetTokenizationState();
        }
        dispose() {
            this._clearTimers();
            super.dispose();
        }
        _clearTimers() {
            if (this._revalidateTokensTimeout !== -1) {
                clearTimeout(this._revalidateTokensTimeout);
                this._revalidateTokensTimeout = -1;
            }
        }
        _resetTokenizationState() {
            this._clearTimers();
            const [tokenizationSupport, initialState] = initializeTokenization(this._textModel);
            this._tokenizationSupport = tokenizationSupport;
            this._tokenizationStateStore.flush(initialState);
            this._beginBackgroundTokenization();
        }
        _beginBackgroundTokenization() {
            if (this._textModel.isAttachedToEditor() && this._hasLinesToTokenize() && this._revalidateTokensTimeout === -1) {
                this._revalidateTokensTimeout = setTimeout(() => {
                    this._revalidateTokensTimeout = -1;
                    this._revalidateTokensNow();
                }, 0);
            }
        }
        _revalidateTokensNow(toLineNumber = this._textModel.getLineCount()) {
            const MAX_ALLOWED_TIME = 20;
            const builder = new tokensStore_1.MultilineTokensBuilder();
            const sw = stopwatch_1.StopWatch.create(false);
            while (this._hasLinesToTokenize()) {
                if (sw.elapsed() > MAX_ALLOWED_TIME) {
                    // Stop if MAX_ALLOWED_TIME is reached
                    break;
                }
                const tokenizedLineNumber = this._tokenizeOneInvalidLine(builder);
                if (tokenizedLineNumber >= toLineNumber) {
                    break;
                }
            }
            this._beginBackgroundTokenization();
            this._textModel.setTokens(builder.tokens);
        }
        tokenizeViewport(startLineNumber, endLineNumber) {
            const builder = new tokensStore_1.MultilineTokensBuilder();
            this._tokenizeViewport(builder, startLineNumber, endLineNumber);
            this._textModel.setTokens(builder.tokens);
        }
        reset() {
            this._resetTokenizationState();
            this._textModel.clearTokens();
        }
        forceTokenization(lineNumber) {
            const builder = new tokensStore_1.MultilineTokensBuilder();
            this._updateTokensUntilLine(builder, lineNumber);
            this._textModel.setTokens(builder.tokens);
        }
        isCheapToTokenize(lineNumber) {
            if (!this._tokenizationSupport) {
                return true;
            }
            const firstInvalidLineNumber = this._tokenizationStateStore.invalidLineStartIndex + 1;
            if (lineNumber > firstInvalidLineNumber) {
                return false;
            }
            if (lineNumber < firstInvalidLineNumber) {
                return true;
            }
            if (this._textModel.getLineLength(lineNumber) < 2048 /* CHEAP_TOKENIZATION_LENGTH_LIMIT */) {
                return true;
            }
            return false;
        }
        _hasLinesToTokenize() {
            if (!this._tokenizationSupport) {
                return false;
            }
            return (this._tokenizationStateStore.invalidLineStartIndex < this._textModel.getLineCount());
        }
        _tokenizeOneInvalidLine(builder) {
            if (!this._hasLinesToTokenize()) {
                return this._textModel.getLineCount() + 1;
            }
            const lineNumber = this._tokenizationStateStore.invalidLineStartIndex + 1;
            this._updateTokensUntilLine(builder, lineNumber);
            return lineNumber;
        }
        _updateTokensUntilLine(builder, lineNumber) {
            if (!this._tokenizationSupport) {
                return;
            }
            const languageIdentifier = this._textModel.getLanguageIdentifier();
            const linesLength = this._textModel.getLineCount();
            const endLineIndex = lineNumber - 1;
            // Validate all states up to and including endLineIndex
            for (let lineIndex = this._tokenizationStateStore.invalidLineStartIndex; lineIndex <= endLineIndex; lineIndex++) {
                const text = this._textModel.getLineContent(lineIndex + 1);
                const lineStartState = this._tokenizationStateStore.getBeginState(lineIndex);
                const r = safeTokenize(languageIdentifier, this._tokenizationSupport, text, lineStartState);
                builder.add(lineIndex + 1, r.tokens);
                this._tokenizationStateStore.setEndState(linesLength, lineIndex, r.endState);
                lineIndex = this._tokenizationStateStore.invalidLineStartIndex - 1; // -1 because the outer loop increments it
            }
        }
        _tokenizeViewport(builder, startLineNumber, endLineNumber) {
            if (!this._tokenizationSupport) {
                // nothing to do
                return;
            }
            if (endLineNumber <= this._tokenizationStateStore.invalidLineStartIndex) {
                // nothing to do
                return;
            }
            if (startLineNumber <= this._tokenizationStateStore.invalidLineStartIndex) {
                // tokenization has reached the viewport start...
                this._updateTokensUntilLine(builder, endLineNumber);
                return;
            }
            let nonWhitespaceColumn = this._textModel.getLineFirstNonWhitespaceColumn(startLineNumber);
            let fakeLines = [];
            let initialState = null;
            for (let i = startLineNumber - 1; nonWhitespaceColumn > 0 && i >= 1; i--) {
                let newNonWhitespaceIndex = this._textModel.getLineFirstNonWhitespaceColumn(i);
                if (newNonWhitespaceIndex === 0) {
                    continue;
                }
                if (newNonWhitespaceIndex < nonWhitespaceColumn) {
                    initialState = this._tokenizationStateStore.getBeginState(i - 1);
                    if (initialState) {
                        break;
                    }
                    fakeLines.push(this._textModel.getLineContent(i));
                    nonWhitespaceColumn = newNonWhitespaceIndex;
                }
            }
            if (!initialState) {
                initialState = this._tokenizationSupport.getInitialState();
            }
            const languageIdentifier = this._textModel.getLanguageIdentifier();
            let state = initialState;
            for (let i = fakeLines.length - 1; i >= 0; i--) {
                let r = safeTokenize(languageIdentifier, this._tokenizationSupport, fakeLines[i], state);
                state = r.endState;
            }
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                let text = this._textModel.getLineContent(lineNumber);
                let r = safeTokenize(languageIdentifier, this._tokenizationSupport, text, state);
                builder.add(lineNumber, r.tokens);
                this._tokenizationStateStore.setFakeTokens(lineNumber - 1);
                state = r.endState;
            }
        }
    }
    exports.TextModelTokenization = TextModelTokenization;
    function initializeTokenization(textModel) {
        const languageIdentifier = textModel.getLanguageIdentifier();
        let tokenizationSupport = (textModel.isTooLargeForTokenization()
            ? null
            : modes_1.TokenizationRegistry.get(languageIdentifier.language));
        let initialState = null;
        if (tokenizationSupport) {
            try {
                initialState = tokenizationSupport.getInitialState();
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
                tokenizationSupport = null;
            }
        }
        return [tokenizationSupport, initialState];
    }
    function safeTokenize(languageIdentifier, tokenizationSupport, text, state) {
        let r = null;
        if (tokenizationSupport) {
            try {
                r = tokenizationSupport.tokenize2(text, state.clone(), 0);
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
            }
        }
        if (!r) {
            r = nullMode_1.nullTokenize2(languageIdentifier.id, text, state, 0);
        }
        lineTokens_1.LineTokens.convertToEndOffset(r.tokens, text.length);
        return r;
    }
});
//# sourceMappingURL=textModelTokens.js.map