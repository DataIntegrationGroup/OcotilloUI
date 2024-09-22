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
import {
    type AuthProvider,
} from "@refinedev/core";
import { sha256 } from "js-sha256";

import {Fief, browser} from '@fief/fief'

/**
 *  mock auth credentials to simulate authentication
 */
const authCredentials = {
    email: "demo@refine.dev",
    password: "demodemo",
};

export const fiefConstants = {
    baseURL: 'https://fief.newmexicowaterdata.org',
    clientId: 'bJNVqsHEndupn6RpIE9rNHQNFtmaXnHBeYqNnXIwCM8'
}

const fiefClient = new Fief(fiefConstants);
const fiefAuth = new browser.FiefAuth(fiefClient);

const getAuthState = () => {
    const item=sessionStorage.getItem('fief-authstate')
    if(item){
        return JSON.parse(item)
    }
}
const gravatarUrl = (email) => {
    let hash = email.trim().toLowerCase();
    return `https://www.gravatar.com/avatar/${sha256(hash)}`;
};

export const authProvider: AuthProvider = {
    login: async ({ providerName, email}) => {

        // if (providerName === "google") {
        //     window.location.href = "https://accounts.google.com/o/oauth2/v2/auth";
        //     return {
        //         success: true,
        //     };
        // }
        //
        // if (providerName === "github") {
        //     window.location.href = "https://github.com/login/oauth/authorize";
        //     return {
        //         success: true,
        //     };
        // }

        if (providerName === "fief") {
            localStorage.setItem("email", email);
            await fiefAuth.redirectToLogin(`${window.location.protocol}//${window.location.host}/callback`);
            return {
                success: true,
            };
        }

        return {
            success: false,
            error: {
                message: "Login failed",
                name: "Invalid email or password",
            },
        };
    },

    register: async (params) => {
        if (params.email === authCredentials.email && params.password) {
            localStorage.setItem("email", params.email);
            return {
                success: true,
                redirectTo: "/",
            };
        }
        return {
            success: false,
            error: {
                message: "Register failed",
                name: "Invalid email or password",
            },
        };
    },
    updatePassword: async (params) => {
        if (params.password === authCredentials.password) {
            //we can update password here
            return {
                success: true,
            };
        }
        return {
            success: false,
            error: {
                message: "Update password failed",
                name: "Invalid password",
            },
        };
    },
    forgotPassword: async (params) => {
        if (params.email === authCredentials.email) {
            //we can send email with reset password link here
            return {
                success: true,
            };
        }
        return {
            success: false,
            error: {
                message: "Forgot password failed",
                name: "Invalid email",
            },
        };
    },
    logout: async () => {
        localStorage.removeItem("email");
        await fiefAuth.logout(`${window.location.protocol}//${window.location.host}/login`);
        return {
            success: true,
        };
    },
    onError: async (error) => {
        if (error.response?.status === 401) {
            return {
                logout: true,
            };
        }

        return { error };
    },
    check: async () =>
        localStorage.getItem("email")
            ? {
                authenticated: true,
            }
            : {
                authenticated: false,
                error: {
                    message: "Check failed",
                    name: "Not authenticated",
                },
                logout: true,
                redirectTo: "/login",
            },
    getPermissions: async () => ["admin"],
    getIdentity: async () => {
        let authstate = getAuthState()
        if(authstate){
            return {avatar: gravatarUrl(authstate.userinfo.email)}
        }
    }
};

// ============= EOF =============================================