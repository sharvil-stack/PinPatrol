import api from "./api";

export const login = (email, password) => {
    return api.post("/api/auth/login", {
        email,
        password,
    });
};

export const signup = (data) => {
    return api.post("/api/auth/signup", data);
};

export const me = () => {
    return api.get("/api/auth/me");
};