import MapComponent from "@/components/MapComponent";
import {memo, useEffect, useReducer, useState} from "react";
import {Layer, Source} from "react-map-gl";


const layers = ['locations', 'locations_heat', 'regions'];

function ControlPanel(props) {
    const [visibility, setVisibility] = useState({
        locations: true,
        locations_heat: true,
        regions: false,
    });

    useEffect(() => {
        // Convert true/false to "visible"/"none"
        const visibilityState = Object.fromEntries(
            Object.entries(visibility).map(([k, v]) => [k, v ? "visible" : "none"])
        );
        props.onChange(visibilityState);
    }, [visibility]);

    const onVisibilityChange = (name, value) => {
        setVisibility({...visibility, [name]: value});
    };

    return (
        // <div className={styles["control-panel"]}>
        <div>
            <h3>Layers</h3>

            {layers.map((layer, i) => (
                <label key={i}>
                    <input type="checkbox"
                           checked={visibility[layer]}
                           onChange={evt => onVisibilityChange(layer, evt.target.checked)}
                    /> {layer}
                </label>
            ))}

            {/*<label><input type="checkbox"*/}
            {/*              checked={visibility["boundaries"]}*/}
            {/*              onChange={evt => onVisibilityChange("boundaries", evt.target.checked)}*/}
            {/*/> Boundaries</label>*/}
        </div>
    )
}

// export default memo(ControlPanel);


const dataset = [
    {
        sourceConfig: {

            id: 'locations',
            type: 'geojson',
            // data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson'
            data: 'https://gisdata.newmexicowaterdata.org/geoserver/water/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=water%3Atbl_location&outputFormat=application%2Fjson&maxFeatures=50'
        },
        layers: [
            {
                id: 'locations',
                type: 'circle',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#B42222'
                }
            },
            {
                id: 'locations_heat',
                type: 'heatmap',

            }
        ]
    },
    {
        sourceConfig: {

            id: 'regions',
            type: 'geojson',
            // data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson'
            data: 'https://gisdata.newmexicowaterdata.org/geoserver/water/ows?service=WFS&version=1.0.0' +
                '&request=GetFeature' +
                '&typeName=water%3ABrackish_water_regions' +
                '&outputFormat=application%2Fjson' +
                '&maxFeatures=50' +
                '&srsname=EPSG:4326'
            //'&srsname=EPSG:3979'
        },
        layers: [
            {
                id: 'regions',
                type: 'fill',
                paint: {'fill-color': '#e3dc88'}
            }
        ]
    }
]

const Layers = ({layerVisibility}) => {


    const layers = dataset.map((dataConfig) => {
        return <Source key={dataConfig.sourceConfig.id} {...dataConfig.sourceConfig}>

            {dataConfig.layers.map((layerConfig) => {

                const visible = layerVisibility[layerConfig.id]
                console.log(layerVisibility, typeof layerVisibility)
                console.log(visible, layerConfig.id, layerVisibility[layerConfig.id])
                return <Layer
                    key={layerConfig.id}
                    layout={{visibility: visible}} {...layerConfig} />
            })}

        </Source>
    })
    return layers

    // return (
    //     <>
    //         <Source
    //             key='foo'
    //             id='foo'
    //             type='geojson'
    //             data={featureCollection}>
    //             <Layer
    //                 id="location"
    //                 type="circle"
    //             />
    //         </Source>
    //     </>
    // )
}
export const MapStudioViewer = () => {
    const [layersVisibility, setLayersVisibility] = useReducer(
        (state, updates) => ({...state, ...updates}
        ), {});

    const [isLoading, setIsLoading] = useState<boolean>(false);
    return (
        <div>
            <h1>Map Studio</h1>
            <p>Welcome to the Map Studio</p>


            <ControlPanel onChange={setLayersVisibility}/>
            <MapComponent
                isLoading={isLoading}
                showDrawControls={{show: true, position: 'top-right'}}
                // setPopupContent={setPopupContent}
                // popupContent={popupContent}
                // onMouseMoveCallback={onMouseMove}
            >
                <Layers layerVisibility={layersVisibility}/>
            </MapComponent>
        </div>
    )
}