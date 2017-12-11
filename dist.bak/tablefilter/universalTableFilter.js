[...document.querySelectorAll('table')]
    .forEach(table => new TableFilter(table, {
        highlight_keywords: true,
        no_results_message: true,
        extensions: [
            { name: 'sort' },
            { name: 'filtersVisibility', visible_at_start: false }
        ],
        base_path: 'chrome-extension://pnpjhhdjihjejnpmedbgngegphcklkag/'
    }).init());
