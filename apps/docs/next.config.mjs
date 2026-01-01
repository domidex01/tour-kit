import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['@tour-kit/core', '@tour-kit/react', '@tour-kit/hints'],
};

export default withMDX(config);
