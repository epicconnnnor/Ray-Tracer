/* LightSample class:
 * intensity: intensity of the light sample (THREE.Color3) 
 * position:  position of the light sample (THREE.Vector3)
 * direction: light vector (i.e. *normalized* direction from shading point to the sample)
 */
class LightSample {
	constructor() {
		this.intensity = null;
		this.position = null;
		this.direction = null;
	}
}

/* PointLight class. This class is fully implemented for you */
class PointLight {
	constructor(position, intensity) {
		this.position = position.clone();
		this.intensity = intensity.clone();
	}
	/* getLight returns a LightSample object
	 * for a given a shading point.
	 */
	getLight(shadingPoint) {
		let ls = new LightSample();
		ls.position = this.position.clone();
		ls.direction = this.position.clone();
		ls.direction.sub(shadingPoint);
		ls.intensity = this.intensity.clone();
		ls.intensity.multiplyScalar(1/ls.direction.lengthSq());	// quadratic falloff of intensity
		ls.direction.normalize();
		return ls;
	}
}

/* SpotLight class */
class SpotLight {
	/* from: position of spot light
	 * to:   target the light is pointing to
	 * exponent: akin to specular highlight's shininess
	 * cutoff: angle cutoff (i.e. 15 degrees etc.)
	 */
	constructor(from, to, intensity, exponent, cutoff) {
		this.from = from.clone();
		this.to = to.clone();
		this.intensity = intensity.clone();
		this.exponent = exponent;
		this.cutoff = cutoff;
	}
	getLight(shadingPoint) {
	let ls = new LightSample();
	ls.position = this.from.clone();
	ls.direction = this.from.clone();
	ls.direction.sub(shadingPoint);

	let L = shadingPoint.clone().sub(this.from); 
	let dist2 = L.lengthSq();
	let Lnorm = L.clone().normalize();

	let D = this.to.clone().sub(this.from).normalize(); 

	let cosAlpha = D.dot(Lnorm); 

	let cosCutoff = Math.cos(this.cutoff * Math.PI / 180);
	let falloff = (cosAlpha >= cosCutoff) ? Math.pow(cosAlpha, this.exponent) : 0;

	ls.intensity = this.intensity.clone();
	ls.intensity.multiplyScalar(falloff / dist2);
	ls.direction.normalize();
	return ls;
	}
}

// approximate an area light by discretizing it into NsxNs point lights
function createAreaLight(center, size, intensity, Ns) {
	const sampleIntensity = intensity.clone().multiplyScalar(size*size/Ns/Ns);	// each sample represents a fraction of the total intensity
	for(let j=0;j<Ns;j++) {
		for(let i=0;i<Ns;i++) {
			let position = new THREE.Vector3(center.x+(i/Ns-0.5)*size, center.y, center.z+(j/Ns-0.5)*size);
			lights.push(new PointLight(position, sampleIntensity));
		}
	}
}
