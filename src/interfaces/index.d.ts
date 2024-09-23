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


export interface ICategory {
    id: number;
    title: string;
}

export type IStatus = "published" | "draft" | "rejected";

export interface IPost {
    id: number;
    title: string;
    content: string;
    status: IStatus;
    category: ICategory;
}

export type Nullable<T> = {
    [P in keyof T]: T[P] | null;
};


export interface ILocation {
    PointID: string;
    SiteID: string;
    PublicRelease: boolean;
    geometry: { coordinates: number[], type: string };
    Easting: number;
    Northing: number;
    // title: string;
    // status: IStatus;
    // category: ICategory;
}

export interface IWell {
    PointID: string;
    OSEWellID: string;
    OSEWelltagID: string;
    formation: string;
    construction_notes: string
}

export interface ILookupTable {
    Code: string;
    Meaning: string;
}

export interface IManualWaterLevel {
    PointID: string;
    PublicRelease: boolean;
    MeasurementDate: string;
    DepthToWaterBGS: number;
}

export interface IMeasuringAgency {
    Agency: string;
    Description: string;
    id: number;
}

export interface IEquipment {
    ID: number;
    PointID: string;
    EquipmentType: string;
    Model: string;
    SerialNo: string;
    DateInstalled: string;
    DateRemoved: string;
}
// ============= EOF =============================================
