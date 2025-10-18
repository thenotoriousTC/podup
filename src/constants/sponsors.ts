export interface Sponsor {
  id: string;
  name: string;
  imagePath: any;
  link: string;
  linkType: 'instagram' | 'website' | 'facebook' | 'twitter';
}

export const sponsors: Sponsor[] = [
  {
    id: '1',
    name: 'Sisoft Tech',
    imagePath: require('@/sponsor/sisoftad.jpg'),
    link: 'https://www.instagram.com/sisoft_tech/',
    linkType: 'instagram',
  },
  {
    id: '2',
    name: 'test',
    imagePath: require('@/sponsor/2.png'),
    link: 'https://www.sisoft.live',
    linkType: 'website',
  },
  // Add more sponsors here in the future
];
