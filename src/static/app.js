document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function createParticipantRow(participant) {
    const listItem = document.createElement("li");
    listItem.className = "participant-item";

    const participantText = document.createElement("span");
    participantText.className = "participant-name";
    participantText.textContent = participant;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "delete-participant-btn";
    removeButton.setAttribute("aria-label", `Unregister ${participant}`);
    removeButton.title = `Unregister ${participant}`;
    removeButton.textContent = "×";
    removeButton.addEventListener("click", async () => {
      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(removeButton.dataset.activity)}/participants/${encodeURIComponent(removeButton.dataset.email)}`,
          { method: "DELETE" }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          showMessage(result.detail || "Unable to unregister this participant.", "error");
          return;
        }

        showMessage(result.message || "Participant removed.", "success");
        await fetchActivities();
      } catch (error) {
        console.error("Error unregistering participant:", error);
        showMessage("Failed to unregister participant. Please try again.", "error");
      }
    });

    removeButton.dataset.activity = removeButton.dataset.activity || "";
    removeButton.dataset.email = participant;

    listItem.appendChild(participantText);
    listItem.appendChild(removeButton);
    return listItem;
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Unable to load activities");
      }

      const activities = await response.json();
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      if (!Object.keys(activities).length) {
        const emptyState = document.createElement("p");
        emptyState.className = "empty-state";
        emptyState.textContent = "No activities are available right now.";
        activitiesList.appendChild(emptyState);
        return;
      }

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = Math.max(details.max_participants - details.participants.length, 0);
        const participants = Array.isArray(details.participants) ? details.participants : [];

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        description.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = "<strong>Schedule:</strong> ";
        schedule.appendChild(document.createTextNode(details.schedule));

        const availability = document.createElement("p");
        availability.innerHTML = "<strong>Availability:</strong> ";
        availability.appendChild(document.createTextNode(`${spotsLeft} spots left`));

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";

        const participantList = document.createElement("ul");
        participantList.className = "participants-list";

        if (!participants.length) {
          const emptyParticipantState = document.createElement("li");
          emptyParticipantState.className = "empty-state";
          emptyParticipantState.textContent = "No participants yet.";
          participantList.appendChild(emptyParticipantState);
        } else {
          participants.forEach((participant) => {
            const item = createParticipantRow(participant);
            const removeButton = item.querySelector("button");
            removeButton.dataset.activity = name;
            participantList.appendChild(item);
          });
        }

        participantsSection.appendChild(participantsHeading);
        participantsSection.appendChild(participantList);

        activityCard.appendChild(title);
        activityCard.appendChild(description);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
      activitiesList.innerHTML = "<p class='error-message'>Failed to load activities. Please try again later.</p>";
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("email");
    const activityInput = document.getElementById("activity");
    const email = emailInput.value.trim();
    const activity = activityInput.value;

    if (!email || !activity) {
      showMessage("Please select an activity and enter a valid email.", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        showMessage(result.message || "Signed up successfully.", "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred while signing up.", "error");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      showMessage("Failed to sign up. Please try again.", "error");
    }
  });

  fetchActivities();
});
