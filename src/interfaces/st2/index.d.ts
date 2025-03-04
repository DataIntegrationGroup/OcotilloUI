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

export interface BaseSTEntity {
    "@iot.id": number;
    name: string;
    properties: any;
    description: string;
}


export interface ILocation extends BaseSTEntity {
    // "@iot.id" : string;
    // name: string;
    // properties: any;
    // PointID: string;
    // SiteID: string;
    // PublicRelease: boolean;
    // geometry: { coordinates: number[], type: string };
    // Easting: number;
    // Northing: number;
    // site_type: string;
    // title: string;
    // status: IStatus;
    // category: ICategory;
}

export interface IThing extends BaseSTEntity {
    Locations?: ILocation[];
}

export interface IWell extends IThing {
}

export interface ISensor extends BaseSTEntity {
    encodingType: string;
    metadata: string;
}

export interface IDatastream extends BaseSTEntity {
    unitOfMeasurement: any;
    observationType: string;

    Thing?: IThing;
    Sensor?: ISensor;
}

export interface IObservation {
    // "@iot.id"?: string;
    phenomenonTime: string;
    result: number;
    Datastream?: IDatastream;
}


export interface IHydrographDatasource {
    id: number;
    data: IObservation[]
    name: string
    style?: string
}

export interface IHydrographOptions {
    useNormalization?: boolean;
    useElevation?: boolean;
    useCompact?: boolean;
    dataZoom?: string;
}

export interface IObservedProperty extends BaseSTEntity {
    definition: string;
    name: string;
}

//
// export interface ILookupTable {
//     Code: string;
//     Meaning: string;
// }
//
// export interface IManualWaterLevel {
//     PointID: string;
//     PublicRelease: boolean;
//     MeasurementDate: string;
//     DepthToWaterBGS: number;
//     MeasuringAgency: string;
//     LevelStatus: string;
//     DataQuality: string;
//     DataSource: string;
//     MeasuredBy: string;
//     SiteNotes: string;
// }
//
// export interface IMeasuringAgency {
//     Agency: string;
//     Description: string;
//     id: number;
// }
//
// export interface IEquipment {
//     ID: number;
//     PointID: string;
//     EquipmentType: string;
//     Model: string;
//     SerialNo: string;
//     DateInstalled: string;
//     DateRemoved: string;
// }
//
// export interface IProject {
//     Project: string
//     PointIDPrefix: string
// }
// ============= EOF =============================================
