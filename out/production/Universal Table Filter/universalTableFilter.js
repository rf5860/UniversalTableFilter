[...document.querySelectorAll('table')]
    .filter(t => !!t.querySelector('tbody>tr') && [...t.querySelectorAll('tbody>tr')].length > 0)
    .forEach(table => new TableFilter(table, 0, {
        alternate_rows: true,
        auto_filter: true,
        auto_filter_delay: 500,
        btn_reset: true,
        filter_rows_index: 0,
        highlight_keywords: true,
        no_results_message: true,
        rows_counter: true,
        status_bar: true,
        extensions: [{ name: 'sort'}, {name: 'advancedGrid', }],
        base_path: 'chrome-extension://pnpjhhdjihjejnpmedbgngegphcklkag/'
    }).init());
