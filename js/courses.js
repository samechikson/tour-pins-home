// Lists every course in Firestore that a pin sheet can be created for.
// The `courses` collection is publicly readable, so the REST API works without auth.
const COURSES_URL =
  "https://firestore.googleapis.com/v1/projects/tour-pin-sheets/databases/(default)/documents/courses" +
  "?pageSize=300&mask.fieldPaths=name&mask.fieldPaths=location";

const searchInput = document.getElementById("course-search");
const statusEl = document.getElementById("course-status");
const listEl = document.getElementById("course-list");

let allCourses = [];

async function fetchCourses() {
  const courses = [];
  let pageToken = "";

  do {
    const url = pageToken
      ? `${COURSES_URL}&pageToken=${encodeURIComponent(pageToken)}`
      : COURSES_URL;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not load courses: ${response.status}`);
    }
    const data = await response.json();

    (data.documents || []).forEach((doc) => {
      const fields = doc.fields || {};
      const name = fields.name && fields.name.stringValue;
      if (!name) return;
      courses.push({
        name: name.trim(),
        location: ((fields.location && fields.location.stringValue) || "").trim(),
      });
    });

    pageToken = data.nextPageToken;
  } while (pageToken);

  return courses.sort((a, b) => a.name.localeCompare(b.name));
}

function courseCard(course) {
  const col = document.createElement("div");
  col.className = "col-lg-4 col-md-6 col-sm-12 my-1";

  const card = document.createElement("div");
  card.className = "card box-shadow h-100";

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h5");
  title.className = "card-title mb-1";
  title.textContent = course.name;

  const location = document.createElement("span");
  location.className = "font-weight-light";
  location.textContent = course.location;

  body.append(title, location);
  card.append(body);
  col.append(card);
  return col;
}

function render(courses) {
  listEl.replaceChildren(...courses.map(courseCard));

  const total = allCourses.length;
  if (!searchInput.value.trim()) {
    statusEl.textContent = `${total} courses available`;
  } else if (courses.length === 0) {
    statusEl.textContent = "No courses match your search.";
  } else {
    statusEl.textContent = `${courses.length} of ${total} courses match`;
  }
}

function filterCourses(term) {
  const query = term.trim().toLowerCase();
  if (!query) return allCourses;
  return allCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(query) ||
      course.location.toLowerCase().includes(query)
  );
}

searchInput.addEventListener("input", () => {
  render(filterCourses(searchInput.value));
});

fetchCourses()
  .then((courses) => {
    allCourses = courses;
    render(filterCourses(searchInput.value));
  })
  .catch((error) => {
    console.error(error);
    statusEl.textContent = "Couldn't load the course list right now.";
  });
