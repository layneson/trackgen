// Size of the canvas.
const SIZE = 500;
const HALF_SIZE = SIZE / 2;

// Size of a displayed point.
const POINT_SIZE = 6;
const HALF_POINT_SIZE = POINT_SIZE / 2;

// Definitions for track generation settings.
//     num_points: The number of points to generate for the initial track.
//     radius: The starting radius to use, as a fraction of the SIZE.
//     radius_jitter: The maximum magnitude by which track points are jittered, as a fraction of radius.
//     theta_jitter: The maximum angle by which track points are jittered, as a fraction of PI.
//     spline_point_density: Number of spline points to calculate per pixel.
//     seed: RNG seed for the track.
const TRACK_SETTINGS = {
    num_points: 10,
    radius: 0.333,
    radius_jitter: 0.3,
    theta_jitter: 1 / 20,
    spline_point_density: 1,
    seed: 12345
};

let canvas = document.getElementById("display");

canvas.width = SIZE;
canvas.height = SIZE;

let ctx = canvas.getContext("2d");

// Returns a point on a centripetal Catmull-Rom spline.
function point_on_curve(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, t) {
    let ret = {};

    let t2 = t * t;
    let t3 = t2 * t;

    ret.x = 0.5 * ((2.0 * p1x) +
    (-p0x + p2x) * t +
    (2.0 * p0x - 5.0 * p1x + 4 * p2x - p3x) * t2 +
    (-p0x + 3.0 * p1x - 3.0 * p2x + p3x) * t3);

    ret.y = 0.5 * ((2.0 * p1y) +
    (-p0y + p2y) * t +
    (2.0 * p0y - 5.0 * p1y + 4 * p2y - p3y) * t2 +
    (-p0y + 3.0 * p1y - 3.0 * p2y + p3y) * t3);

    return ret;
}

// Generates and draws a track.
function draw_track(settings) {
    // Initialize the RNG.
    const rand = new Math.seedrandom(settings.seed);

    // Get a random number in range [min, max).
    function get_random(min, max) {
        return rand() * (max - min) + min;
    }

    // Clear the screen.
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, SIZE, SIZE);

    let points = new Array();

    // Pick first random points.
    for (let i = 0; i < settings.num_points; i++) {
        let r = settings.radius * SIZE + get_random(-1, 1) * settings.radius_jitter * settings.radius * SIZE;
        let t = (i / settings.num_points) * (2 * Math.PI) + get_random(-1, 1) * settings.theta_jitter * Math.PI;

        let x = HALF_SIZE + r * Math.cos(t);
        let y = HALF_SIZE + r * Math.sin(t);

        points.push({x, y});
    }

    // Draw a spline.
    for (let i = 0; i < settings.num_points; i++) {
        let p0 = points[i];
        let p1 = points[(i + 1) % settings.num_points];
        let p2 = points[(i + 2) % settings.num_points];
        let p3 = points[(i + 3) % settings.num_points];

        // Calculate distance between p1 and p2.
        let dist = Math.sqrt((p2.x - p1.x)*(p2.x - p1.x) + (p2.y - p1.y)*(p2.y - p1.y));
        // Use that to get the number of spline points to use.
        let num_spline_points = dist * settings.spline_point_density;

        for (let j = 0; j < num_spline_points; j++) {
            let time = j / num_spline_points;

            let point = point_on_curve(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, time);

            ctx.fillStyle = "blue";
            ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
        }
    }

    // Draw control points.
    for (let point of points) {
        ctx.fillStyle = "red";
        ctx.fillRect(point.x - HALF_POINT_SIZE, point.y - HALF_POINT_SIZE, POINT_SIZE, POINT_SIZE);
    }
}

// The current track settings.
let current_track_settings = Object.assign({}, TRACK_SETTINGS);

function update_track() {
    draw_track(current_track_settings);
}

// Creates a slider and display for a specific setting.
function bind_slider_display(slider, display, setting_name) {
    slider.value = current_track_settings[setting_name];
    display.textContent = slider.value;
    slider.addEventListener("input", () => {
        display.textContent = slider.value;
        current_track_settings[setting_name] = Number(slider.value);
        update_track();
    });
}

// Binds a textbox to a setting.
function bind_textbox(box, setting_name) {
    box.value = current_track_settings[setting_name];
    box.addEventListener("input", () => {
        current_track_settings[setting_name] = Number(box.value);
        update_track();
    });
}

// Bind UI.
let i_seed = document.getElementById("i_seed");
bind_textbox(i_seed, "seed");

let i_num_points = document.getElementById("i_num_points");
let id_num_points = document.getElementById("id_num_points");
bind_slider_display(i_num_points, id_num_points, "num_points");

let i_radius = document.getElementById("i_radius");
let id_radius = document.getElementById("id_radius");
bind_slider_display(i_radius, id_radius, "radius");

let i_radius_jitter = document.getElementById("i_radius_jitter");
let id_radius_jitter = document.getElementById("id_radius_jitter");
bind_slider_display(i_radius_jitter, id_radius_jitter, "radius_jitter");

let i_theta_jitter = document.getElementById("i_theta_jitter");
let id_theta_jitter = document.getElementById("id_theta_jitter");
bind_slider_display(i_theta_jitter, id_theta_jitter, "theta_jitter");

let i_spline_point_density = document.getElementById("i_spline_point_density");
let id_spline_point_density = document.getElementById("id_spline_point_density");
bind_slider_display(i_spline_point_density, id_spline_point_density, "spline_point_density");

// Bind button listeners.
let b_random_seed = document.getElementById("b_random_seed");
b_random_seed.addEventListener("click", () => {
    let rng = new Math.seedrandom();
    let new_seed = Math.abs(rng.int32());

    i_seed.value = new_seed;
    current_track_settings.seed = new_seed;
    update_track();
});

let b_reset = document.getElementById("b_reset");
b_reset.addEventListener("click", () => {
    current_track_settings = Object.assign({}, TRACK_SETTINGS);
    // Refresh
    location.reload();
    update_track();
});

// Call draw_track initially.
draw_track(current_track_settings);