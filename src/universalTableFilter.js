[...document.querySelectorAll('table')]
    .forEach(table => new TableFilter(table, {
        highlight_keywords: true,
        no_results_message: true,

        alternate_rows: true,
        rows_counter: true,
        loader: true,
        // grid layout customisation
        grid_layout: {
            width: '890px',
            height: '400px',
            filters: false,
            cont_css_class: 'grd-main-cont',
            tbl_head_css_class: 'grd-head-cont',
            tbl_cont_css_class: 'grd-cont'
        },
        extensions: [
            { name: 'sort' },
            { name: 'filtersVisibility', visible_at_start: false }
        ],
        base_path: 'chrome-extension://pnpjhhdjihjejnpmedbgngegphcklkag/'
    }).init());
