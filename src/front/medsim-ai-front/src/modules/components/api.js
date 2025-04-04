import axios from "axios";

// middle ware to modify the request route and its content type and allows for storing cookie
const API = axios.create({
    baseURL: "/",
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default API;
