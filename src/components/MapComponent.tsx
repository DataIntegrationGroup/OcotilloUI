// ===============================================================================
// Copyright 2024 Jake Ross
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===============================================================================

import {useCallback, useContext, useRef, useState} from "react";
import {Layer, Map, NavigationControl, Popup, Source} from "react-map-gl";
import {ColorModeContext} from "@/contexts";
import DrawControl from "./DrawControl.jsx";
import "mapbox-gl/dist/mapbox-gl.css";
import GeocoderControl from "./GeocoderControl.jsx";
import {ControlPosition} from "react-map-gl";

const mapboxToken = "pk.eyJ1IjoiamFrZXJvc3N3ZGkiLCJhIjoiY2s3M3ZneGl4MGhkMDNrcjlocmNuNWg4bCJ9.4r1DRDQ_ja0fV2nnmlVT0A"

interface MapComponentProps {
    children?: any;
    onClick?: any;
    setSelectionPolygons?: any;
    popupContent?: any;
    setPopupContent?: any;
    onMouseMoveCallback?: any;
    showDrawControls?: { show: boolean, position: ControlPosition };
    showNavigation?: { show: boolean, position: ControlPosition };
    showGeocoder?: { show: boolean, position: ControlPosition };
}

const MapComponent: React.FC<MapComponentProps> = ({children,
                                                       onClick,
                                                       popupContent,
                                                       setPopupContent,
                                                       onMouseMoveCallback,
                                                       setSelectionPolygons,
                                                       showDrawControls = {show: true, position: "top-right"},
                                                       showNavigation = {
                                                           show: true,
                                                           position: "top-right" as ControlPosition
                                                       },
                                                       showGeocoder = {show: true, position: "top-left"},
                                                   }) => {

    const {mode} = useContext(ColorModeContext);
    const [isDrawing, setIsDrawing] = useState(false);
    const mapStyle = mode === 'dark' ? "mapbox://styles/mapbox/dark-v10" : "mapbox://styles/mapbox/light-v10";
    const style = {width: "100%", height: "650px"}
    const mapRef = useRef(null);
    const initialViewState = {
        longitude: -106.4,
        latitude: 34.5,
        zoom: 6,
    };

    const getCurrentPoints = (e) => {
        // if (sources.length === 0) {
        //     return [[], []];
        // }
        if (!mapRef || !mapRef.current) {
            return [[]];
        }

        // const sourceids = sources.map((s) => s.id);
        let features = mapRef.current.queryRenderedFeatures(e.point);
        return features.filter((f) => f.type === "Feature");

        // let prop = property_identifier;
        // if (prop === undefined) {
        //     prop = "name";
        // }

        // features = features.filter(
        //     (f) => f.type === "Feature" && sourceids.includes(f.source),
        // );
        // return [
        //     features,
        //     features.map((f) => {
        //         if (sourceData[f.source].features === undefined) {
        //             return;
        //         }
        //         // console.log("ff", f, sourceData[f.source].features);
        //         return sourceData[f.source].features.find(
        //             (ff) => ff.properties[prop] === f.properties[prop],
        //         );
        //     }),
        // ];
    };

    const onUpdate = useCallback((e) => {
        setSelectionPolygons((currFeatures) => {
            const newFeatures = {...currFeatures};
            for (const f of e.features) {
                newFeatures[f.id] = f;
            }
            return newFeatures;
        });
    }, []);

    const onDelete = useCallback((e) => {
        setSelectionPolygons((currFeatures) => {
            const newFeatures = {...currFeatures};
            for (const f of e.features) {
                delete newFeatures[f.id];
            }
            return newFeatures;
        });
    }, []);

    const onMouseMove = (e) => {
        if (mapRef === undefined) {
            return;
        }

        if (isDrawing === true) {
            return;
        }

        const features = getCurrentPoints(e);
        if (onMouseMoveCallback !== undefined) {
            onMouseMoveCallback(e, features, mapRef);
        }
    };

    const onModeChange = useCallback((e) => {
        console.log("mode", e);
        setIsDrawing(e.mode === "draw_polygon");
    }, []);

    const onSelectionChange = useCallback((e) => {
        console.log("selection change", e);
        setIsDrawing(e.features.length > 0);
    }, []);

    return (
        <div>
            <Map
                ref={mapRef}
                mapboxAccessToken={mapboxToken}
                initialViewState={initialViewState}
                onClick={onClick}
                // fog={{
                //   range: [0.8, 8],
                //   // "color": "#f3dddd",
                //   "horizon-blend": 0.05,
                //   "high-color": "#245bde",
                //   "space-color": "#000000",
                //   "star-intensity": 0.95,
                // }}
                terrain={{source: "mapbox-dem", exaggeration: 3}}
                // projection={"globe"}
                style={style}
                mapStyle={mapStyle}
                onMouseMove={onMouseMove}
                // cursor={}
                // onClick={onMouseClick}
                // onContextMenu={onContextMenu}
            >
                {/*{layers}*/}
                {/*{dynamicLayers}*/}

                {/*<ContextMenu model={mapContextMenu} ref={cmRef}/>*/}
                {showGeocoder?.show && (
                    <GeocoderControl
                        token={mapboxToken}
                        position={showGeocoder?.position}
                    />
                )}
                {showNavigation?.show && (
                    <NavigationControl position={showNavigation?.position}/>
                )}
                {showDrawControls?.show && (
                    <DrawControl
                        displayControlsDefault={false}
                        controls={{
                            polygon: true,
                            trash: true,
                            combine_features: true,
                            uncombine_features: true,
                        }}
                        // defaultFeatures={defaultFeatures}
                        onCreate={onUpdate}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onModeChange={onModeChange}
                        onSelectionChange={onSelectionChange}
                        position={showDrawControls?.position}
                    />
                )}

                {popupContent !== null && (
                    <Popup
                        latitude={popupContent.coordinates[1]}
                        longitude={popupContent.coordinates[0]}
                        // maxWidth={500}
                        closeButton={false}
                        // closeOnMove
                        closeOnClick
                        // onClose={() => setStickyPopup(false)}
                    >
                        {popupContent.children}
                    </Popup>
                )}

                {/*<Source*/}
                {/*  id={"highlightedPoint"}*/}
                {/*  type={"geojson"}*/}
                {/*  data={highlightedPoint}*/}
                {/*>*/}
                {/*  <Layer*/}
                {/*    id={"highlightedPoint"}*/}
                {/*    type={"circle"}*/}
                {/*    paint={{*/}
                {/*      "circle-radius": 6,*/}
                {/*      "circle-color": "transparent",*/}
                {/*      "circle-stroke-color": "#e7df60",*/}
                {/*      "circle-stroke-width": 3,*/}
                {/*    }}*/}
                {/*  />*/}
                {/*</Source>*/}
                {children}
            </Map>
        </div>
    )
}

export default MapComponent;
// ============= EOF =============================================