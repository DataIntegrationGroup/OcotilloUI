---
title: Connect the Ocotillo OGC API to desktop GIS
deck: Use the Ocotillo OGC API Features endpoint to browse collections in ArcGIS Desktop and in QGIS.
---

> [!WARNING]
> OGC API layers are read-only in desktop GIS. Use them for discovery, map display, querying, and export.

##### Ocotillo OGC landing page URL

```text
{{ ocotillo_api_url }}/ogcapi
```

## ArcGIS Pro / Desktop

1. On the **Insert** tab, in the **Project** group, click **Connections > Server > New OGC API Server**. The **Add OGC API Server Connection** dialog box appears.
2. Enter this URL ([{{ ocotillo_api_url }}/ogcapi]({{ ocotillo_api_url }}/ogcapi)) in the **Server URL** text box.
3. Leave the rest of the options as-is and click OK.
4. In the Catalog pane, expand the “Servers” folder. You should see the Ocotillo OGC API connection. Expand the connection, then expand “Features”. Drag the datasets you want into your map area.
5. When adding a layer, a dialog box will appear with spatial extent options. Click OK to add the entire contents. You can also check the “Use Spatial Extent” box and spatially filter via options in the “Get extent from:” box - e.g. spatially filter by existing layers, selected polygon extents, visible extent, etc.

**Official documentation:**  
[How to add OGC API datasets to ArcGIS Pro](https://pro.arcgis.com/en/pro-app/latest/help/data/services/add-ogc-api-services.htm)  
[https://pro.arcgis.com/en/pro-app/latest/help/data/services/use-ogc-api-services.htm](https://pro.arcgis.com/en/pro-app/latest/help/data/services/use-ogc-api-services.htm)

---

## QGIS

1. Open **Data Source Manager**.
2. Choose the WFS / OGC API - Features connection tab.
3. Create a new connection using the Ocotillo landing page URL.
4. Connect to the server, select one or more collections, and add them to the map.
5. For large layers, set paging or feature limits in the connection and layer options.

> [!INFO]
> QGIS expects the OGC API landing page, not a single collection items URL, when you create the server connection.

**Official documentation:**  
[https://docs.qgis.org/latest/en/docs/user_manual/working_with_ogc/ogc_client_support.html](https://docs.qgis.org/latest/en/docs/user_manual/working_with_ogc/ogc_client_support.html)

---

## Useful Ocotillo endpoints

### Landing page

[{{ ocotillo_api_url }}/ogcapi]({{ ocotillo_api_url }}/ogcapi)

Use this as the server URL when creating the connection.

### Collections

[{{ ocotillo_api_url }}/ogcapi/collections]({{ ocotillo_api_url }}/ogcapi/collections)

Review available collections before connecting from desktop GIS.

---

## Common collections to look for

- [!CHIPS]
- Water Wells
- Springs
- Latest TDS
- Water Well Summary

Collection names can change by deployment. If you do not see one of these, open the [collections endpoint]({{ ocotillo_api_url }}/ogcapi/collections) and use the names published there.
