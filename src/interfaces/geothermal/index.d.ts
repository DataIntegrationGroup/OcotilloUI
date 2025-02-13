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


export interface IWell {
    OBJECTID: integer;
    // SiteID: string;
    // PublicRelease: boolean;
    // geometry: { coordinates: number[], type: string };
    // Easting: number;
    // Northing: number;
    // title: string;
    // status: IStatus;
    // category: ICategory;
}

export interface IWellRecord {
    API_suffix: string;
    ActionDate: string;
    Comments: string;
    EnteredBy: string;
    EntryDate: string;
    OBJECTID: string;
    RecrdSetID: string;
    SourceID: string;
    WellDataID: string;
    WellName: string;
    WellNumber: string;
}

// ============= EOF =============================================
