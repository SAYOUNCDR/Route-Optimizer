// graph data
let graph = {
  // Ambulance Stations
  A1: { I1: 3, I5: 4, S1: 2 },
  A2: { I2: 3, I6: 5, H3: 6 },

  // Intersections (main traffic points)
  I1: { A1: 3, I2: 4, I3: 5, I5: 3, I6: 2 },
  I2: { A2: 3, I1: 4, I4: 3, I6: 4, H1: 2 },
  I3: { I1: 5, I4: 4, I5: 6, H2: 3, S2: 4 },
  I4: { I2: 3, I3: 4, I6: 3, H1: 4, H3: 2 },
  I5: { A1: 4, I1: 3, I3: 6, I6: 5, S1: 3 },
  I6: { A2: 5, I1: 2, I2: 4, I4: 3, I5: 5, H2: 2, H3: 3 },

  // Hospitals
  H1: { I2: 2, I4: 4, H2: 6, H3: 5 },
  H2: { I3: 3, I6: 2, H1: 6, H3: 4, S2: 3 },
  H3: { A2: 6, I4: 2, I6: 3, H1: 5, H2: 4 },

  // Schools
  S1: { A1: 2, I5: 3, S2: 7 },
  S2: { I3: 4, H2: 3, S1: 7 },
};

// Original graph for resetting
const originalGraph = JSON.parse(JSON.stringify(graph));

// Cordinates pos of nodes [Visualization]
const nodePositions = {
  // Ambulance Stations
  A1: { x: 100, y: 450 },
  A2: { x: 100, y: 150 },

  // Intersections
  I1: { x: 250, y: 300 },
  I2: { x: 250, y: 150 },
  I3: { x: 400, y: 450 },
  I4: { x: 550, y: 250 },
  I5: { x: 150, y: 350 },
  I6: { x: 400, y: 250 },

  // Hospitals
  H1: { x: 350, y: 100 },
  H2: { x: 550, y: 400 },
  H3: { x: 650, y: 200 },

  // Schools
  S1: { x: 100, y: 300 },
  S2: { x: 600, y: 500 },
};

// PQ for Dijkstra's algorithm
class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(node, priority) {
    this.queue.push({ node, priority });
    this.sort();
  }

  dequeue() {
    return this.queue.shift();
  }

  sort() {
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

// Dijkstra's algorithm implementation
function dijkstra(graph, start, end) {
  const distances = {};
  const previous = {};
  const pq = new PriorityQueue();

  // Initialize distances
  for (const node in graph) {
    distances[node] = node === start ? 0 : Infinity;
    pq.enqueue(node, distances[node]);
  }

  while (!pq.isEmpty()) {
    const { node: current } = pq.dequeue();

    if (current === end) break;

    for (const neighbor in graph[current]) {
      const newDistance = distances[current] + graph[current][neighbor];
      if (newDistance < distances[neighbor]) {
        distances[neighbor] = newDistance;
        previous[neighbor] = current;
        pq.enqueue(neighbor, newDistance);
      }
    }
  }

  // Reconstruct path
  const path = [];
  let current = end;
  while (current !== start && previous[current]) {
    path.unshift(current);
    current = previous[current];
  }
  if (current === start) path.unshift(start);

  return {
    path: path.length > 1 ? path : [],
    distance: distances[end],
  };
}

// Get node type for styling
function getNodeType(node) {
  if (node.startsWith("A")) return "ambulance-node";
  if (node.startsWith("H")) return "hospital-node";
  if (node.startsWith("S")) return "school-node";
  return "normal-node";
}

// Initialize UI
document.addEventListener("DOMContentLoaded", () => {
  const graphSvg = document.getElementById("graph");
  const startNodeSelect = document.getElementById("start-node");
  const endNodeSelect = document.getElementById("end-node");
  const findPathBtn = document.getElementById("find-path");
  const simulateTrafficBtn = document.getElementById("simulate-traffic");
  const trafficSlider = document.getElementById("traffic-slider");
  const trafficValue = document.getElementById("traffic-value");
  const trafficIndicator = document.getElementById("traffic-indicator");
  const pathResult = document.getElementById("path-result");
  const timeResult = document.getElementById("time-result");

  // Store references to edge and label elements
  let edgeElements = {};
  let edgeLabelElements = {};

  // Draw the graph
  function drawGraph() {
    graphSvg.innerHTML = "";
    edgeElements = {};
    edgeLabelElements = {};

    // Draw edges first (so nodes appear on top)
    for (const node in graph) {
      for (const neighbor in graph[node]) {
        // Only draw each edge once
        if (!edgeElements[`${neighbor}-${node}`]) {
          const startPos = nodePositions[node];
          const endPos = nodePositions[neighbor];

          // Create edge line
          const edge = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          edge.setAttribute("x1", startPos.x);
          edge.setAttribute("y1", startPos.y);
          edge.setAttribute("x2", endPos.x);
          edge.setAttribute("y2", endPos.y);
          edge.setAttribute("stroke", "#777");
          edge.setAttribute("stroke-width", 2);
          edge.setAttribute("class", "edge");
          edge.id = `edge-${node}-${neighbor}`;
          graphSvg.appendChild(edge);
          edgeElements[`${node}-${neighbor}`] = edge;

          // Calculate midpoint for label
          const midX = (startPos.x + endPos.x) / 2;
          const midY = (startPos.y + endPos.y) / 2;

          // Label edge weights
          const label = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          label.setAttribute("x", midX);
          label.setAttribute("y", midY);
          label.setAttribute("fill", "black");
          label.setAttribute("font-size", "12px");
          label.setAttribute("text-anchor", "middle");
          label.setAttribute("dominant-baseline", "middle");
          label.textContent = graph[node][neighbor];
          label.id = `label-${node}-${neighbor}`;
          graphSvg.appendChild(label);
          edgeLabelElements[`${node}-${neighbor}`] = label;
        }
      }
    }

    // Draw nodes
    for (const node in nodePositions) {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", nodePositions[node].x);
      circle.setAttribute("cy", nodePositions[node].y);
      circle.setAttribute("r", 15);
      circle.setAttribute("class", getNodeType(node));
      graphSvg.appendChild(circle);

      // Add node label
      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      label.setAttribute("x", nodePositions[node].x);
      label.setAttribute("y", nodePositions[node].y);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "middle");
      label.setAttribute("fill", "white");
      label.setAttribute("font-weight", "bold");
      label.setAttribute("font-size", "11px");
      label.textContent = node;
      graphSvg.appendChild(label);
    }

    // Highlight start and end nodes if selected
    updateNodeHighlights();
  }

  // Update start/end node highlights
  function updateNodeHighlights() {
    // Remove previous highlights
    document.querySelectorAll(".start-node, .end-node").forEach((el) => {
      el.classList.remove("start-node", "end-node");
      // Restore original class
      const node = el.nextElementSibling.textContent;
      el.className = getNodeType(node);
    });

    // Add new highlights
    const startNode = document.querySelector(
      `circle[cx="${nodePositions[startNodeSelect.value].x}"][cy="${
        nodePositions[startNodeSelect.value].y
      }"]`
    );
    const endNode = document.querySelector(
      `circle[cx="${nodePositions[endNodeSelect.value].x}"][cy="${
        nodePositions[endNodeSelect.value].y
      }"]`
    );

    if (startNode) {
      startNode.className = "start-node";
    }

    if (endNode) {
      endNode.className = "end-node";
    }
  }

  // Find and highlight shortest path
  function findShortestPath() {
    const start = startNodeSelect.value;
    const end = endNodeSelect.value;

    // Clear previous path highlights
    document.querySelectorAll("line").forEach((el) => {
      el.classList.remove("path-edge");
      el.setAttribute("stroke", "#777");
      el.setAttribute("stroke-width", 2);
    });
    document.querySelectorAll("text").forEach((el) => {
      el.classList.remove("path-edge-label");
      el.setAttribute("fill", "black");
      el.setAttribute("font-weight", "normal");
    });

    const { path, distance } = dijkstra(graph, start, end);

    if (path.length === 0) {
      pathResult.textContent = `❌ No path found from ${start} to ${end}!`;
      timeResult.textContent = "";
      return;
    }

    pathResult.textContent = `🔵 Shortest path: ${path.join(" → ")}`;
    timeResult.textContent = `⏱️ Estimated time: ${distance} minutes`;

    // Highlight path edges and labels
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      // Highlight edge
      if (edgeElements[`${from}-${to}`]) {
        const edge = edgeElements[`${from}-${to}`];
        edge.setAttribute("stroke", "#FFEB3B");
        edge.setAttribute("stroke-width", 4);
        edge.classList.add("path-edge");
      } else if (edgeElements[`${to}-${from}`]) {
        const edge = edgeElements[`${to}-${from}`];
        edge.setAttribute("stroke", "#FFEB3B");
        edge.setAttribute("stroke-width", 4);
        edge.classList.add("path-edge");
      }

      // Highlight label
      if (edgeLabelElements[`${from}-${to}`]) {
        const label = edgeLabelElements[`${from}-${to}`];
        label.setAttribute("fill", "#FFC107");
        label.setAttribute("font-weight", "bold");
        label.classList.add("path-edge-label");
      } else if (edgeLabelElements[`${to}-${from}`]) {
        const label = edgeLabelElements[`${to}-${from}`];
        label.setAttribute("fill", "#FFC107");
        label.setAttribute("font-weight", "bold");
        label.classList.add("path-edge-label");
      }
    }
  }

  // Simulate traffic (adjust weights randomly)
  function simulateTraffic() {
    const trafficLevel = parseInt(trafficSlider.value);

    // Reset graph to original weights
    graph = JSON.parse(JSON.stringify(originalGraph));

    // Increase weights based on traffic
    for (const node in graph) {
      for (const neighbor in graph[node]) {
        graph[node][neighbor] += Math.floor(Math.random() * trafficLevel);
        // Ensure minimum weight of 1
        if (graph[node][neighbor] < 1) graph[node][neighbor] = 1;
      }
    }

    // Update traffic display
    updateTrafficDisplay(trafficLevel);

    // Redraw graph with new weights
    drawGraph();

    // Highlight all edge labels with neon green
    for (const labelId in edgeLabelElements) {
      edgeLabelElements[labelId].classList.add("traffic-edge-label");
    }

    // If we had a path, recalculate it
    if (pathResult.textContent.includes("Shortest path")) {
      findShortestPath();
    }
  }

  // Update traffic display
  function updateTrafficDisplay(level) {
    trafficValue.textContent = level;

    // Update traffic indicator color
    trafficIndicator.className = "traffic-indicator";
    if (level <= 3) {
      trafficIndicator.classList.add("traffic-light");
    } else if (level <= 6) {
      trafficIndicator.classList.add("traffic-moderate");
    } else {
      trafficIndicator.classList.add("traffic-heavy");
    }
  }

  // Event listeners
  findPathBtn.addEventListener("click", findShortestPath);
  simulateTrafficBtn.addEventListener("click", simulateTraffic);
  trafficSlider.addEventListener("input", () => {
    updateTrafficDisplay(parseInt(trafficSlider.value));
  });
  startNodeSelect.addEventListener("change", updateNodeHighlights);
  endNodeSelect.addEventListener("change", updateNodeHighlights);

  // Initial setup
  updateTrafficDisplay(3);
  drawGraph();
});
