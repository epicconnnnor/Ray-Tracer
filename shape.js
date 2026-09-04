/* Intersection class:
 * t:        ray parameter, i.e. distance of the intersection point to ray's origin
 * position: position (THREE.Vector3) of intersection point
 * normal:   normal (THREE.Vector3) of intersection point
 * material: material of the intersection object
 */
class Intersection {
	constructor() {
		this.t = 0;
		this.position = new THREE.Vector3();
		this.normal = new THREE.Vector3();
		this.material = null;
	}
	set(isect) {
		this.t = isect.t;
		this.position = isect.position;
		this.normal = isect.normal;
		this.material = isect.material;
	}
}

/* Plane class. This class is fully implemented for you
 * P0: a point (THREE.Vector3) that the plane passes through
 * n:  plane's normal (THREE.Vector3)
 */
class Plane {
	constructor(P0, n, material) {
		this.P0 = P0.clone();
		this.n = n.clone();
		this.n.normalize();
		this.material = material;
	}
	// Given ray and range [tmin,tmax], return intersection point.
	// Return null if no intersection.
	intersect(ray, tmin, tmax) {
		let temp = this.P0.clone();
		temp.sub(ray.o); // (P0-O)
		let denom = ray.d.dot(this.n); // d.n
		if(denom==0) { return null;	}
		let t = temp.dot(this.n)/denom; // (P0-O).n / d.n
		if(t<tmin || t>tmax) return null; // check range
		let isect = new Intersection();   // create intersection structure
		isect.t = t;
		isect.position = ray.pointAt(t);
		isect.normal = this.n;
		isect.material = this.material;
		return isect;
	}
}

/* Sphere shape
 * C: center of sphere (type THREE.Vector3)
 * r: radius
 */
class Sphere {
	constructor(C, r, material) {
		this.C = C.clone();
		this.r = r;
		this.r2 = r*r;
		this.material = material;
	}
	intersect(ray, tmin, tmax) {
	let oc = ray.o.clone().sub(this.C); // O - C

	let A = ray.d.dot(ray.d);
	let B = 2 * oc.dot(ray.d);
	let C = oc.dot(oc) - this.r2;

	let delta = B * B - 4 * A * C;
	if (delta < 0) return null;

	let sqrtDelta = Math.sqrt(delta);
	let t1 = (-B - sqrtDelta) / (2 * A);
	let t2 = (-B + sqrtDelta) / (2 * A); 

	let t = (t1 >= tmin && t1 <= tmax) ? t1 :
	        (t2 >= tmin && t2 <= tmax) ? t2 : null;

	if (t === null) return null;

	let position = ray.pointAt(t);
	let normal = position.clone().sub(this.C).normalize();

	let isect = new Intersection();
	isect.t = t;
	isect.position = position;
	isect.normal = normal;
	isect.material = this.material;
	return isect;
	}
}

class Triangle {
	/* P0, P1, P2: three vertices (type THREE.Vector3) that define the triangle
	 * n0, n1, n2: normal (type THREE.Vector3) of each vertex */
	constructor(P0, P1, P2, material, n0, n1, n2) {
		this.P0 = P0.clone();
		this.P1 = P1.clone();
		this.P2 = P2.clone();
		this.material = material;
		if(n0) this.n0 = n0.clone();
		if(n1) this.n1 = n1.clone();
		if(n2) this.n2 = n2.clone();

		// below you may pre-compute any variables that are needed for intersect function
		// such as the triangle normal etc.
this.faceNormal = this.P1.clone().sub(this.P0)
.cross(this.P2.clone().sub(this.P0))
.normalize();
	} 

	intersect(ray, tmin, tmax) {
		const EPSILON = 1e-6;
		let O = ray.o, d = ray.d;
		let P0 = this.P0, P1 = this.P1, P2 = this.P2;

		let A_col1 = d;
		let A_col2 = P2.clone().sub(P0);
		let A_col3 = P2.clone().sub(P1);
		let rhs = P2.clone().sub(O);

		let A = new THREE.Matrix3();
		A.set(
			A_col1.x, A_col2.x, A_col3.x,
			A_col1.y, A_col2.y, A_col3.y,
			A_col1.z, A_col2.z, A_col3.z
		);
		let detA = A.determinant();
		if (Math.abs(detA) < EPSILON) return null;

		// Cramer's
		let At = new THREE.Matrix3();
		At.set(rhs.x, A_col2.x, A_col3.x,
			   rhs.y, A_col2.y, A_col3.y,
			   rhs.z, A_col2.z, A_col3.z);
		let t = At.determinant() / detA;

		let Aalpha = new THREE.Matrix3();
		Aalpha.set(A_col1.x, rhs.x, A_col3.x,
				   A_col1.y, rhs.y, A_col3.y,
				   A_col1.z, rhs.z, A_col3.z);
		let alpha = Aalpha.determinant() / detA;

		let Abeta = new THREE.Matrix3();
		Abeta.set(A_col1.x, A_col2.x, rhs.x,
				  A_col1.y, A_col2.y, rhs.y,
				  A_col1.z, A_col2.z, rhs.z);
		let beta = Abeta.determinant() / detA;

		let gamma = 1 - alpha - beta;

		// Must check conditions
		if (alpha < 0 || beta < 0 || gamma < 0) return null;
		if (t < tmin || t > tmax) return null;

		let position = ray.pointAt(t);
		let normal;

		if (this.n0 && this.n1 && this.n2) {
			normal = this.n0.clone().multiplyScalar(alpha)
				.addScaledVector(this.n1, beta)
				.addScaledVector(this.n2, gamma)
				.normalize();
		} else {
			normal = this.faceNormal.clone();
		}

		let isect = new Intersection();
		isect.t = t;
		isect.position = position;
		isect.normal = normal;
		isect.material = this.material;

		return isect;
	}
}

function shapeLoadOBJ(objstring, material, smoothnormal) {
	loadOBJFromString(objstring, function(mesh) { // callback function for non-blocking load
		if(smoothnormal) mesh.computeVertexNormals();
		for(let i=0;i<mesh.faces.length;i++) {
			let p0 = mesh.vertices[mesh.faces[i].a];
			let p1 = mesh.vertices[mesh.faces[i].b];
			let p2 = mesh.vertices[mesh.faces[i].c];
			if(smoothnormal) {
				let n0 = mesh.faces[i].vertexNormals[0];
				let n1 = mesh.faces[i].vertexNormals[1];
				let n2 = mesh.faces[i].vertexNormals[2];
				shapes.push(new Triangle(p0, p1, p2, material, n0, n1, n2));
			} else {
				shapes.push(new Triangle(p0, p1, p2, material));
			}
		}
	}, function() {}, function() {});
}
