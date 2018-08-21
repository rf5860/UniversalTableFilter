[...document.querySelectorAll('table')]
    .forEach(table => new TableFilter(table, 2, {
        auto_filter: true,
        auto_filter_delay: 300,
        btn_reset: true,
        highlight_keywords: true,
        no_results_message: true,
        rows_counter: true,
        status_bar: true,
        loader: true,
        extensions: [
            { name: 'filtersVisibility' }, { name: 'colsVisibility' }, { name: 'sort' }, { name: 'colOps' }
        ],
        base_path: 'chrome-extension://pnpjhhdjihjejnpmedbgngegphcklkag/'
    }).init());
