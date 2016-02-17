<coect-breadcrumbs>
  <nav class="coect-breadcrumbs" role="navigation" aria-label="breadcrumbs">
    <ol class="breadcrumb" itemscope itemtype="http://schema.org/BreadcrumbList">
      <li each={ item, i in opts.items } class={active: !item.url}
          itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <a if={ item.url } href={ item.url } itemprop="item" class="h-breadcrumb">
          <span itemprop="name">{ item.name }</span>
        </a>
        <strong if={ !item.url }>{ item.name }</strong>
        <meta itemprop="position" content={ i + 1 } />
      </li>
    </ol>
  </nav>
</coect-breadcrumbs>
