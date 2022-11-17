// https://github.com/SilentVoid13/Templater

import { FuzzyMatch, FuzzySuggestModal } from "obsidian";

export class SuggesterModal<T> extends FuzzySuggestModal<T> {
    private resolve: (value: T) => void;
    private submitted = false;

    constructor(
        private text_items: string[] | ((item: T) => string),
        private items: T[],
        placeholder: string,
        limit?: number
    ) {
        super(app);
        this.setPlaceholder(placeholder);
        limit && (this.limit = limit);
    }

    getItems(): T[] {
        return this.items;
    }

    onClose(): void {
    }

    selectSuggestion(
        value: FuzzyMatch<T>,
        evt: MouseEvent | KeyboardEvent
    ): void {
        this.submitted = true;
        this.close();
        this.onChooseSuggestion(value, evt);
    }

    getItemText(item: T): string {
        if (this.text_items instanceof Function) {
            return this.text_items(item);
        }
        return (
            this.text_items[this.items.indexOf(item)] || "Undefined Text Item"
        );
    }

    onChooseItem(item: T): void {
        this.resolve(item);
    }

    async openAndGetValue(
        resolve: (value: T) => void,
    ): Promise<void> {
        this.resolve = resolve;
        this.open();
    }
}

export function generate_suggester(): <T>(
    text_items: string[] | ((item: T) => string),
    items: T[],
    throw_on_cancel: boolean,
    placeholder: string,
    limit?: number
) => Promise<T> {
    return async <T>(
        text_items: string[] | ((item: T) => string),
        items: T[],
        throw_on_cancel = false,
        placeholder = "",
        limit?: number
    ): Promise<T> => {
        const suggester = new SuggesterModal(
            text_items,
            items,
            placeholder,
            limit
        );
        const promise = new Promise(
            (
                resolve: (value: T) => void,
            ) => suggester.openAndGetValue(resolve)
        );
        try {
            return await promise;
        } catch (error) {
            if (throw_on_cancel) {
                throw error;
            }
            return null as unknown as T;
        }
    };
}