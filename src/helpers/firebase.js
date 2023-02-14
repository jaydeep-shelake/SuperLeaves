const { db } = require("../plugins/firebase.config.js");
const { getOrderKey } = require("./calender");
const exceptionUsers = ["babybaby85325@gmail.com", "shakunthalla10@gmail.com"];
const fetchAllUsers = () => {
  return new Promise(async (resolve, reject) => {
    const refString = "SuperMeals-One/allUsers";
    const refPath = db.ref(refString);
    refPath
      .get(refPath)
      .then((snapshot) => {
        let data = {};
        if (snapshot.exists()) {
          data = snapshot.val();
        }
        resolve({ code: 200, status: "success", data });
      })
      .catch((error) => {
        reject({
          code: 500,
          status: "error",
          message: "Internal server error",
        });
      });
  });
};

fetchAllItems = () => {
  return new Promise(async (resolve, reject) => {
    const refString = "SuperMeals-One/allItems";
    const refPath = db.ref(refString);

    refPath
      .get(refPath)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const allItems = snapshot.val();
          resolve({ code: 200, status: "success", data: allItems });
        } else {
          reject({ code: 500, status: "error", message: "Items not found" });
        }
      })
      .catch((error) => {
        reject({
          code: 500,
          status: "error",
          message: "Internal server error",
        });
      });
  });
};

function fetchAllOrders() {
  return new Promise(async (resolve, reject) => {
    const baseStr = `SuperMeals-One/allOrders`;
    const orderKey = getOrderKey();
    const userWise = [];
    const itemWiseObj = {};
    fetchAllItems().then((res) => {
      allItems = res.data;
      fetchAllUsers().then((result) => {
        const data = result.data;
        const users = Object.values(data);

        let filteredUsers = users.filter((user) => {
          return (
            user.email.includes("@quiph.com") ||
            user.email.includes("@ssup.co") ||
            exceptionUsers.includes(user.email)
          );
        });

        const newfilteredUsers = filteredUsers.map((obj) => {
          return obj.email;
        });

        // console.log(filteredUsers);
        filteredUsers.forEach((id) => {
          // console.log(id);
          const user = data[id.id];

          const refString = `${baseStr}/${user.id}/${orderKey}`;
          const refPath = db.ref(refString);
          refPath.get(refPath).then((snapshot) => {
            let data = [];
            if (snapshot.exists()) {
              data = snapshot.val();
              const orderedArray = user.email;

              userWise.push(orderedArray); // answers users
            }
            if (id === filteredUsers[filteredUsers.length - 1]) {
              const notAnsUsers = newfilteredUsers.filter(
                (item) => !userWise.some((u) => u === item)
              );

              resolve({ code: 200, status: "success", data: notAnsUsers });
            }
            // resolve({ code: 200, status: "success", data: userWise });
          });
        });
      });
    });
  });
}

module.exports = {
  fetchAllOrders,
};
