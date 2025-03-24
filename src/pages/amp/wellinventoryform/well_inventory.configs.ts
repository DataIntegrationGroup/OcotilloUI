export const fetchConfig = (accessToken: string,
                            method: string = "GET",
                            formData?: object) => {
    return {
        method: method,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: formData ? JSON.stringify(formData) : null,
    };
};

export const lookupTableQueryConfig = {
    staleTime: 600000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
};

export const locationLabels = {
    utm: ["Easting", "Northing"],
    gcs: ["Longitude", "Latitude"],
};
